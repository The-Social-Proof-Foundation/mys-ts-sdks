// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { IdentifierString, WalletAccount } from '@wallet-standard/core';

/** Name of the feature. */
export const MysReportTransactionEffects = 'mys:reportTransactionEffects';

/** The latest API version of the reportTransactionEffects API. */
export type MysReportTransactionEffectsVersion = '1.0.0';

/**
 * A Wallet Standard feature for reporting the effects of a transaction block executed by a dapp
 * The feature allows wallets to updated their caches using the effects of the transaction
 * executed outside of the wallet
 */
export type MysReportTransactionEffectsFeature = {
	/** Namespace for the feature. */
	[MysReportTransactionEffects]: {
		/** Version of the feature API. */
		version: MysReportTransactionEffectsVersion;
		reportTransactionEffects: MysReportTransactionEffectsMethod;
	};
};

export type MysReportTransactionEffectsMethod = (
	input: MysReportTransactionEffectsInput,
) => Promise<void>;

/** Input for signing transactions. */
export interface MysReportTransactionEffectsInput {
	account: WalletAccount;
	chain: IdentifierString;
	/** Transaction effects as base64 encoded bcs. */
	effects: string;
}
