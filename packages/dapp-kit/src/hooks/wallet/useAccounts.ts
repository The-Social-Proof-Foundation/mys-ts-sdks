// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { WalletAccount } from '@mysocial/wallet-standard';

import { useWalletStore } from './useWalletStore.js';

/**
 * Retrieves a list of connected accounts authorized by the dApp.
 */
export function useAccounts(): readonly WalletAccount[] {
	return useWalletStore((state) => state.accounts);
}
