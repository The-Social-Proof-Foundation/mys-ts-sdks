// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { PublicKey, SignatureScheme } from '@mysocial/mys/cryptography';
import { SIGNATURE_FLAG_TO_SCHEME, Signer } from '@mysocial/mys/cryptography';
import type { DAppKit } from './core/index.js';
import type { Transaction } from '@mysocial/mys/transactions';
import type { Experimental_MysClientTypes } from '@mysocial/mys/experimental';
import { parseTransactionBcs, parseTransactionEffectsBcs } from '@mysocial/mys/experimental';
import { toBase64, fromBase64 } from '@mysocial/mys/utils';

export class CurrentAccountSigner extends Signer {
	dAppKit: DAppKit;

	constructor(store: DAppKit) {
		super();
		this.dAppKit = store;
	}

	getKeyScheme(): SignatureScheme {
		return SIGNATURE_FLAG_TO_SCHEME[
			this.getPublicKey().flag() as keyof typeof SIGNATURE_FLAG_TO_SCHEME
		];
	}

	getPublicKey(): PublicKey {
		const publicKey = this.dAppKit.stores.$publicKey.get();

		if (!publicKey) {
			throw new Error('DappKit is not currently connected to an account');
		}

		return publicKey;
	}

	sign(_data: Uint8Array): never {
		throw new Error(
			'WalletSigner does not support signing directly. Use signTransaction or signPersonalMessage instead',
		);
	}

	async signTransaction(bytes: Uint8Array) {
		return this.dAppKit.signTransaction({
			transaction: toBase64(bytes),
		});
	}

	async signPersonalMessage(bytes: Uint8Array) {
		return this.dAppKit.signPersonalMessage({
			message: bytes,
		});
	}

	async signAndExecuteTransaction({
		transaction,
	}: {
		transaction: Transaction;
	}): Promise<Experimental_MysClientTypes.TransactionResponse> {
		const { bytes, signature, digest, effects } = await this.dAppKit.signAndExecuteTransaction({
			transaction,
		});

		return {
			digest,
			signatures: [signature],
			epoch: null,
			effects: parseTransactionEffectsBcs(fromBase64(effects)),
			objectTypes: {
				get then() {
					const promise = Promise.reject<Record<string, string>>(
						new Error('objectTypes is not implemented for WalletSigner'),
					);

					return promise.then.bind(promise);
				},
			},
			transaction: parseTransactionBcs(fromBase64(bytes)),
		};
	}
}
