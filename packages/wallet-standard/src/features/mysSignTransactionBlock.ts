// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { Transaction } from '@socialproof/mys/transactions';
import type { IdentifierString, WalletAccount } from '@wallet-standard/core';

/** Name of the feature. */
export const MysSignTransactionBlock = 'mys:signTransactionBlock';

/** The latest API version of the signTransactionBlock API. */
export type MysSignTransactionBlockVersion = '1.0.0';

/**
 * @deprecated Use `mys:signTransaction` instead.
 *
 * A Wallet Standard feature for signing a transaction, and returning the
 * serialized transaction and transaction signature.
 */
export type MysSignTransactionBlockFeature = {
	/** Namespace for the feature. */
	[MysSignTransactionBlock]: {
		/** Version of the feature API. */
		version: MysSignTransactionBlockVersion;
		/** @deprecated Use `mys:signTransaction` instead. */
		signTransactionBlock: MysSignTransactionBlockMethod;
	};
};

/** @deprecated Use `mys:signTransaction` instead. */
export type MysSignTransactionBlockMethod = (
	input: MysSignTransactionBlockInput,
) => Promise<MysSignTransactionBlockOutput>;

/** Input for signing transactions. */
export interface MysSignTransactionBlockInput {
	transactionBlock: Transaction;
	account: WalletAccount;
	chain: IdentifierString;
}

/** Output of signing transactions. */
export interface MysSignTransactionBlockOutput extends SignedTransactionBlock {}

export interface SignedTransactionBlock {
	/** Transaction as base64 encoded bcs. */
	transactionBlockBytes: string;
	/** Base64 encoded signature */
	signature: string;
}
