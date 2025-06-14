// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { StandardConnect, StandardEvents } from '@wallet-standard/core';
import type { Wallet, WalletWithFeatures } from '@wallet-standard/core';

import type { MinimallyRequiredFeatures } from './features/index.js';

// These features are absolutely required for wallets to function in the Mys ecosystem.
// Eventually, as wallets have more consistent support of features, we may want to extend this list.
const REQUIRED_FEATURES: (keyof MinimallyRequiredFeatures)[] = [StandardConnect, StandardEvents];

export function isWalletWithRequiredFeatureSet<AdditionalFeatures extends Wallet['features']>(
	wallet: Wallet,
	additionalFeatures: (keyof AdditionalFeatures)[] = [],
): wallet is WalletWithFeatures<MinimallyRequiredFeatures & AdditionalFeatures> {
	return [...REQUIRED_FEATURES, ...additionalFeatures].every(
		(feature) => feature in wallet.features,
	);
}
