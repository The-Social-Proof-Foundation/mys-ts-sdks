// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type {
	IdentifierRecord,
	StandardConnectFeature,
	StandardDisconnectFeature,
	StandardEventsFeature,
	WalletWithFeatures,
} from '@wallet-standard/core';

import type { MysReportTransactionEffectsFeature } from './mysReportTransactionEffects.js';
import type { MysSignAndExecuteTransactionFeature } from './mysSignAndExecuteTransaction.js';
import type { MysSignAndExecuteTransactionBlockFeature } from './mysSignAndExecuteTransactionBlock.js';
import type { MysSignMessageFeature } from './mysSignMessage.js';
import type { MysSignPersonalMessageFeature } from './mysSignPersonalMessage.js';
import type { MysSignTransactionFeature } from './mysSignTransaction.js';
import type { MysSignTransactionBlockFeature } from './mysSignTransactionBlock.js';

/**
 * Wallet Standard features that are unique to Mys, and that all Mys wallets are expected to implement.
 */
export type MysFeatures = Partial<MysSignTransactionBlockFeature> &
	Partial<MysSignAndExecuteTransactionBlockFeature> &
	MysSignPersonalMessageFeature &
	MysSignAndExecuteTransactionFeature &
	MysSignTransactionFeature &
	// This deprecated feature should be removed once wallets update to the new method:
	Partial<MysSignMessageFeature> &
	Partial<MysReportTransactionEffectsFeature>;

export type MysWalletFeatures = StandardConnectFeature &
	StandardEventsFeature &
	MysFeatures &
	// Disconnect is an optional feature:
	Partial<StandardDisconnectFeature>;

export type WalletWithMysFeatures = WalletWithFeatures<MysWalletFeatures>;

/**
 * Represents a wallet with the absolute minimum feature set required to function in the Mys ecosystem.
 */
export type WalletWithRequiredFeatures = WalletWithFeatures<
	MinimallyRequiredFeatures &
		Partial<MysFeatures> &
		Partial<StandardDisconnectFeature> &
		IdentifierRecord<unknown>
>;

export type MinimallyRequiredFeatures = StandardConnectFeature & StandardEventsFeature;

export * from './mysSignMessage.js';
export * from './mysSignTransactionBlock.js';
export * from './mysSignTransaction.js';
export * from './mysSignAndExecuteTransactionBlock.js';
export * from './mysSignAndExecuteTransaction.js';
export * from './mysSignPersonalMessage.js';
export * from './mysReportTransactionEffects.js';
