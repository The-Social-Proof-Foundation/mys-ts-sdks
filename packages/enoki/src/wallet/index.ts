// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { MysClient } from '@socialproof/mys/client';
import { Transaction } from '@socialproof/mys/transactions';
import { fromBase64, toBase64 } from '@socialproof/mys/utils';
import type {
	IdentifierArray,
	IdentifierString,
	StandardConnectFeature,
	StandardConnectMethod,
	StandardDisconnectFeature,
	StandardDisconnectMethod,
	StandardEventsFeature,
	StandardEventsOnMethod,
	MysSignAndExecuteTransactionFeature,
	MysSignAndExecuteTransactionMethod,
	MysSignPersonalMessageFeature,
	MysSignPersonalMessageMethod,
	MysSignTransactionFeature,
	MysSignTransactionMethod,
	Wallet,
} from '@socialproof/wallet-standard';
import { getWallets, ReadonlyWalletAccount } from '@socialproof/wallet-standard';
import type { Emitter } from 'mitt';
import mitt from 'mitt';

import type { AuthProvider } from '../EnokiClient/type.js';
import { ENOKI_PROVIDER_WALLETS_INFO } from './providers.js';
import { INTERNAL_ONLY_EnokiFlow } from './state.js';
import type { RegisterEnokiWalletsOptions, WalletEventsMap } from './types.js';

export class EnokiWallet implements Wallet {
	#events: Emitter<WalletEventsMap>;
	#accounts: ReadonlyWalletAccount[];
	#name: string;
	#id: string;
	#icon: Wallet['icon'];
	#flow: INTERNAL_ONLY_EnokiFlow;
	#provider: AuthProvider;
	#clientId: string;
	#redirectUrl: string | undefined;
	#extraParams: Record<string, string> | undefined;
	#client;
	#windowFeatures?: string | (() => string);

	get id() {
		return this.#id;
	}

	get name() {
		return this.#name;
	}

	get provider() {
		return this.#provider;
	}

	get icon() {
		return this.#icon;
	}

	get version() {
		return '1.0.0' as const;
	}

	get chains() {
		return [`mys:${this.#flow.network}`] as const;
	}

	get accounts() {
		return this.#accounts;
	}

	get features(): StandardConnectFeature &
		StandardDisconnectFeature &
		StandardEventsFeature &
		MysSignTransactionFeature &
		MysSignAndExecuteTransactionFeature &
		MysSignPersonalMessageFeature {
		return {
			'standard:connect': {
				version: '1.0.0',
				connect: this.#connect,
			},
			'standard:disconnect': {
				version: '1.0.0',
				disconnect: this.#disconnect,
			},
			'standard:events': {
				version: '1.0.0',
				on: this.#on,
			},
			'mys:signTransaction': {
				version: '2.0.0',
				signTransaction: this.#signTransaction,
			},
			'mys:signAndExecuteTransaction': {
				version: '2.0.0',
				signAndExecuteTransaction: this.#signAndExecuteTransaction,
			},
			'mys:signPersonalMessage': {
				version: '1.1.0',
				signPersonalMessage: this.#signPersonalMessage,
			},
		};
	}

	constructor({
		name,
		icon,
		flow,
		provider,
		clientId,
		redirectUrl,
		extraParams,
		client,
		windowFeatures,
	}: {
		icon: Wallet['icon'];
		name: string;
		flow: INTERNAL_ONLY_EnokiFlow;
		provider: AuthProvider;
		clientId: string;
		redirectUrl?: string;
		extraParams?: Record<string, string>;
		client: MysClient;
		windowFeatures?: string | (() => string);
	}) {
		this.#accounts = [];
		this.#events = mitt();

		this.#client = client;
		this.#name = name;
		this.#id = `enoki:${provider}:${flow.network}:${clientId}`;
		this.#icon = icon;
		this.#flow = flow;
		this.#provider = provider;
		this.#clientId = clientId;
		this.#redirectUrl = redirectUrl;
		this.#extraParams = extraParams;
		this.#windowFeatures = windowFeatures;

		this.#setAccount();
	}

	#signTransaction: MysSignTransactionMethod = async ({ transaction, chain, account }) => {
		this.#validateChain(chain);

		const parsedTransaction = Transaction.from(await transaction.toJSON());
		const keypair = await this.#flow.getKeypair();
		const mysAddress = keypair.toMysAddress();

		if (mysAddress !== account.address) {
			throw new Error(
				`The specified account ${account.address} does not match the currently connected Enoki address ${mysAddress}.`,
			);
		}

		parsedTransaction.setSenderIfNotSet(mysAddress);
		return keypair.signTransaction(await parsedTransaction.build({ client: this.#client }));
	};

	#signAndExecuteTransaction: MysSignAndExecuteTransactionMethod = async ({
		transaction,
		chain,
		account,
	}) => {
		const { signature, bytes } = await this.#signTransaction({ transaction, account, chain });
		const { digest, rawEffects } = await this.#client.executeTransactionBlock({
			transactionBlock: bytes,
			signature,
			options: {
				showRawEffects: true,
			},
		});

		return {
			digest,
			signature,
			bytes,
			effects: toBase64(Uint8Array.from(rawEffects!)),
		};
	};

	#signPersonalMessage: MysSignPersonalMessageMethod = async ({ message, account, chain }) => {
		this.#validateChain(chain);

		const keypair = await this.#flow.getKeypair();
		const mysAddress = keypair.toMysAddress();

		if (mysAddress !== account.address) {
			throw new Error(
				`The specified account ${account.address} does not match the currently connected Enoki address ${mysAddress}.`,
			);
		}

		return keypair.signPersonalMessage(message);
	};

	#on: StandardEventsOnMethod = (event, listener) => {
		this.#events.on(event, listener);
		return () => this.#events.off(event, listener);
	};

	#setAccount() {
		const state = this.#flow.$zkLoginState.get();
		if (state.address && state.publicKey) {
			this.#accounts = [
				new ReadonlyWalletAccount({
					address: state.address,
					chains: this.chains,
					features: Object.keys(this.features) as IdentifierArray,
					publicKey: fromBase64(state.publicKey),
				}),
			];
		} else {
			this.#accounts = [];
		}

		this.#events.emit('change', { accounts: this.accounts });
	}

	#connect: StandardConnectMethod = async (input) => {
		this.#setAccount();

		if (this.accounts.length || input?.silent) {
			return { accounts: this.accounts };
		}

		const popup = window.open(
			undefined,
			'_blank',
			typeof this.#windowFeatures === 'function' ? this.#windowFeatures() : this.#windowFeatures,
		);
		if (!popup) {
			throw new Error('Failed to open popup');
		}

		const url = await this.#flow.createAuthorizationURL({
			provider: this.#provider,
			clientId: this.#clientId,
			redirectUrl: this.#redirectUrl ?? window.location.href.split('#')[0],
			extraParams: this.#extraParams,
		});

		popup.location = url;

		await new Promise<void>((resolve, reject) => {
			const interval = setInterval(() => {
				try {
					if (popup.closed) {
						clearInterval(interval);
						reject(new Error('Popup closed'));
					}

					if (!popup.location.hash) {
						return;
					}
				} catch (e) {
					return;
				}
				clearInterval(interval);

				this.#flow.handleAuthCallback(popup.location.hash).then(() => resolve(), reject);

				try {
					popup.close();
				} catch (e) {
					console.error(e);
				}
			}, 16);
		});

		this.#setAccount();

		return { accounts: this.accounts };
	};

	#disconnect: StandardDisconnectMethod = async () => {
		await this.#flow.logout();

		this.#setAccount();
	};

	#validateChain(chain?: IdentifierString): asserts chain is (typeof this.chains)[number] {
		if (!chain || !this.chains.includes(chain as (typeof this.chains)[number])) {
			throw new Error(
				`A valid Mys chain identifier was not provided in the request. Please report this issue to the dApp developer. Examples of valid Mys chain identifiers are 'mys:testnet' and 'mys:mainnet'. Consider using the '@socialproof/dapp-kit' package, which provides this value automatically.`,
			);
		}
	}
}

export function registerEnokiWallets({
	providers,
	client,
	network = 'mainnet',
	windowFeatures = defaultWindowFeatures,
	...config
}: RegisterEnokiWalletsOptions) {
	const walletsApi = getWallets();
	const flow = new INTERNAL_ONLY_EnokiFlow({ ...config, network });

	const unregisterCallbacks: (() => void)[] = [];
	const wallets: Partial<Record<AuthProvider, EnokiWallet>> = {};

	for (const { name, icon, provider } of ENOKI_PROVIDER_WALLETS_INFO) {
		const providerOptions = providers[provider];
		if (providerOptions) {
			const { clientId, redirectUrl, extraParams } = providerOptions;
			const wallet = new EnokiWallet({
				name,
				icon,
				flow,
				provider,
				clientId,
				client,
				redirectUrl,
				extraParams,
				windowFeatures,
			});

			const unregister = walletsApi.register(wallet);
			unregisterCallbacks.push(unregister);

			wallets[provider] = wallet;
		}
	}

	return {
		wallets,
		unregister: () => {
			for (const unregister of unregisterCallbacks) {
				unregister();
			}
		},
	};
}

export function isEnokiWallet(wallet: Wallet): wallet is EnokiWallet {
	return !!wallet.id?.startsWith('enoki:');
}

export function defaultWindowFeatures() {
	const width = 500;
	const height = 800;
	const left = (screen.width - width) / 2;
	const top = (screen.height - height) / 4;

	return `popup=1;toolbar=0;status=0;resizable=1,width=${width},height=${height},top=${top},left=${left}`;
}
