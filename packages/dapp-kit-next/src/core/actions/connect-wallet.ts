// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { DAppKitStores } from '../store.js';
import { task } from 'nanostores';
import type { UiWallet, UiWalletAccount } from '@wallet-standard/ui';
import type { StandardConnectInput } from '@mysocial/wallet-standard';
import type { StandardConnectFeature } from '@mysocial/wallet-standard';
import { StandardConnect } from '@mysocial/wallet-standard';
import { getWalletFeature, uiWalletAccountBelongsToUiWallet } from '@wallet-standard/ui';
import {
	getOrCreateUiWalletAccountForStandardWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as getOrCreateUiWalletAccountForStandardWalletAccount,
	getWalletForHandle_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as getWalletForHandle,
} from '@wallet-standard/ui-registry';
import { WalletAccountNotFoundError, WalletNoAccountsConnectedError } from '../../utils/errors.js';
import type { Experimental_MysClientTypes } from '@mysocial/mys/experimental';
import { getChain } from '../../utils/networks.js';

export type ConnectWalletArgs = {
	/** The wallet to connect to. */
	wallet: UiWallet;

	/**
	 * An optional account to set as the selected account.
	 * @defaultValue The first authorized account.
	 */
	account?: UiWalletAccount;
} & Omit<StandardConnectInput, 'silent'>;

export function connectWalletCreator(
	{ $baseConnection }: DAppKitStores,
	supportedNetworks: readonly Experimental_MysClientTypes.Network[],
) {
	/**
	 * Prompts the specified wallet to connect and authorize new accounts for the current domain.
	 */
	return async function connectWallet({
		wallet,
		account,
		...standardConnectArgs
	}: ConnectWalletArgs) {
		return await task(async () => {
			const connection = $baseConnection.get();
			const isAlreadyConnected = connection.status === 'connected';

			try {
				$baseConnection.setKey('status', isAlreadyConnected ? 'reconnecting' : 'connecting');

				const { connect } = getWalletFeature(
					wallet,
					StandardConnect,
				) as StandardConnectFeature[typeof StandardConnect];

				const result = await connect(standardConnectArgs);

				const underlyingWallet = getWalletForHandle(wallet);
				const supportedChains = supportedNetworks.map(getChain);

				const mysAccounts = result.accounts
					.filter((account) => account.chains.some((chain) => supportedChains.includes(chain)))
					.map(getOrCreateUiWalletAccountForStandardWalletAccount.bind(null, underlyingWallet));

				if (!isAlreadyConnected && mysAccounts.length === 0) {
					throw new WalletNoAccountsConnectedError('No accounts were authorized.');
				}

				if (account && !uiWalletAccountBelongsToUiWallet(account, wallet)) {
					throw new WalletAccountNotFoundError(
						`No account with address ${account.address} is authorized for ${wallet.name}.`,
					);
				}

				$baseConnection.set({
					status: 'connected',
					currentAccount: account ?? mysAccounts[0],
				});

				return { accounts: mysAccounts };
			} catch (error) {
				$baseConnection.setKey('status', isAlreadyConnected ? 'connected' : 'disconnected');
				throw error;
			}
		});
	};
}
