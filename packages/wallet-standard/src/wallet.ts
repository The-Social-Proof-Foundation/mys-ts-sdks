// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/mys/bcs';
import { Transaction } from '@mysocial/mys/transactions';
import { fromBase64, toBase64 } from '@mysocial/mys/utils';
import type { WalletWithFeatures } from '@wallet-standard/core';

import type {
	MysSignAndExecuteTransactionInput,
	MysSignTransactionInput,
	MysWalletFeatures,
} from './features/index.js';

declare module '@wallet-standard/core' {
	export interface Wallet {
		/**
		 * Unique identifier of the Wallet.
		 *
		 * If not provided, the wallet name will be used as the identifier.
		 */
		readonly id?: string;
	}

	export interface StandardConnectOutput {
		supportedIntents?: string[];
	}
}

export type { Wallet } from '@wallet-standard/core';

export async function signAndExecuteTransaction(
	wallet: WalletWithFeatures<Partial<MysWalletFeatures>>,
	input: MysSignAndExecuteTransactionInput,
) {
	if (wallet.features['mys:signAndExecuteTransaction']) {
		return wallet.features['mys:signAndExecuteTransaction'].signAndExecuteTransaction(input);
	}

	if (!wallet.features['mys:signAndExecuteTransactionBlock']) {
		throw new Error(
			`Provided wallet (${wallet.name}) does not support the signAndExecuteTransaction feature.`,
		);
	}

	const { signAndExecuteTransactionBlock } = wallet.features['mys:signAndExecuteTransactionBlock'];

	const transactionBlock = Transaction.from(await input.transaction.toJSON());
	const { digest, rawEffects, rawTransaction } = await signAndExecuteTransactionBlock({
		account: input.account,
		chain: input.chain,
		transactionBlock,
		options: {
			showRawEffects: true,
			showRawInput: true,
		},
	});

	const [
		{
			txSignatures: [signature],
			intentMessage: { value: bcsTransaction },
		},
	] = bcs.SenderSignedData.parse(fromBase64(rawTransaction!));

	const bytes = bcs.TransactionData.serialize(bcsTransaction).toBase64();

	return {
		digest,
		signature,
		bytes,
		effects: toBase64(new Uint8Array(rawEffects!)),
	};
}

export async function signTransaction(
	wallet: WalletWithFeatures<Partial<MysWalletFeatures>>,
	input: MysSignTransactionInput,
) {
	if (wallet.features['mys:signTransaction']) {
		return wallet.features['mys:signTransaction'].signTransaction(input);
	}

	if (!wallet.features['mys:signTransactionBlock']) {
		throw new Error(
			`Provided wallet (${wallet.name}) does not support the signTransaction feature.`,
		);
	}

	const { signTransactionBlock } = wallet.features['mys:signTransactionBlock'];

	const transaction = Transaction.from(await input.transaction.toJSON());
	const { transactionBlockBytes, signature } = await signTransactionBlock({
		transactionBlock: transaction,
		account: input.account,
		chain: input.chain,
	});

	return { bytes: transactionBlockBytes, signature };
}
