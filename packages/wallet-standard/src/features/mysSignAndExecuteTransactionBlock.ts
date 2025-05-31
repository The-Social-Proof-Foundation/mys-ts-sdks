// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type {
	ExecuteTransactionRequestType,
	MysTransactionBlockResponse,
	MysTransactionBlockResponseOptions,
} from '@mysocial/mys/client';

import type { MysSignTransactionBlockInput } from './mysSignTransactionBlock.js';

/** Name of the feature. */
export const MysSignAndExecuteTransactionBlock = 'mys:signAndExecuteTransactionBlock';

/** The latest API version of the signAndExecuteTransactionBlock API. */
export type MysSignAndExecuteTransactionBlockVersion = '1.0.0';

/**
 * @deprecated Use `mys:signAndExecuteTransaction` instead.
 *
 * A Wallet Standard feature for signing a transaction, and submitting it to the
 * network. The wallet is expected to submit the transaction to the network via RPC,
 * and return the transaction response.
 */
export type MysSignAndExecuteTransactionBlockFeature = {
	/** Namespace for the feature. */
	[MysSignAndExecuteTransactionBlock]: {
		/** Version of the feature API. */
		version: MysSignAndExecuteTransactionBlockVersion;
		/** @deprecated Use `mys:signAndExecuteTransaction` instead. */
		signAndExecuteTransactionBlock: MysSignAndExecuteTransactionBlockMethod;
	};
};

/** @deprecated Use `mys:signAndExecuteTransaction` instead. */
export type MysSignAndExecuteTransactionBlockMethod = (
	input: MysSignAndExecuteTransactionBlockInput,
) => Promise<MysSignAndExecuteTransactionBlockOutput>;

/** Input for signing and sending transactions. */
export interface MysSignAndExecuteTransactionBlockInput extends MysSignTransactionBlockInput {
	/**
	 * @deprecated requestType will be ignored by JSON RPC in the future
	 */
	requestType?: ExecuteTransactionRequestType;
	/** specify which fields to return (e.g., transaction, effects, events, etc). By default, only the transaction digest will be returned. */
	options?: MysTransactionBlockResponseOptions;
}

/** Output of signing and sending transactions. */
export interface MysSignAndExecuteTransactionBlockOutput extends MysTransactionBlockResponse {}
