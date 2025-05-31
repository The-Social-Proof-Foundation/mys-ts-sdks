// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { SignedTransaction, MysSignTransactionInput } from './mysSignTransaction.js';

/** Name of the feature. */
export const MysSignAndExecuteTransaction = 'mys:signAndExecuteTransaction';

/** The latest API version of the signAndExecuteTransactionBlock API. */
export type MysSignAndExecuteTransactionVersion = '2.0.0';

/**
 * A Wallet Standard feature for signing a transaction, and submitting it to the
 * network. The wallet is expected to submit the transaction to the network via RPC,
 * and return the transaction response.
 */
export type MysSignAndExecuteTransactionFeature = {
	/** Namespace for the feature. */
	[MysSignAndExecuteTransaction]: {
		/** Version of the feature API. */
		version: MysSignAndExecuteTransactionVersion;
		signAndExecuteTransaction: MysSignAndExecuteTransactionMethod;
	};
};

export type MysSignAndExecuteTransactionMethod = (
	input: MysSignAndExecuteTransactionInput,
) => Promise<MysSignAndExecuteTransactionOutput>;

/** Input for signing and sending transactions. */
export interface MysSignAndExecuteTransactionInput extends MysSignTransactionInput {}

/** Output of signing and sending transactions. */
export interface MysSignAndExecuteTransactionOutput extends SignedTransaction {
	digest: string;
	/** Transaction effects as base64 encoded bcs. */
	effects: string;
}
