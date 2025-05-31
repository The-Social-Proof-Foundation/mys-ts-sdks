// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { MysWalletFeatures, WalletWithRequiredFeatures } from '@mysocial/wallet-standard';
import { SLUSH_WALLET_NAME } from '@mysocial/slush-wallet';

import { createInMemoryStore } from '../utils/stateStorage.js';

export const MYS_WALLET_NAME = 'Mys Wallet';

export const DEFAULT_STORAGE =
	typeof window !== 'undefined' && window.localStorage ? localStorage : createInMemoryStore();

export const DEFAULT_STORAGE_KEY = 'mys-dapp-kit:wallet-connection-info';

const SIGN_FEATURES = [
	'mys:signTransaction',
	'mys:signTransactionBlock',
] satisfies (keyof MysWalletFeatures)[];

export const DEFAULT_WALLET_FILTER = (wallet: WalletWithRequiredFeatures) =>
	SIGN_FEATURES.some((feature) => wallet.features[feature]);

export const DEFAULT_PREFERRED_WALLETS = [MYS_WALLET_NAME, SLUSH_WALLET_NAME];
