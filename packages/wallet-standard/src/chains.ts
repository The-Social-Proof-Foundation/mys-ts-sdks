// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { IdentifierString } from '@wallet-standard/core';

/** Mys Devnet */
export const MYS_DEVNET_CHAIN = 'mys:devnet';

/** Mys Testnet */
export const MYS_TESTNET_CHAIN = 'mys:testnet';

/** Mys Localnet */
export const MYS_LOCALNET_CHAIN = 'mys:localnet';

/** Mys Mainnet */
export const MYS_MAINNET_CHAIN = 'mys:mainnet';

export const MYS_CHAINS = [
	MYS_DEVNET_CHAIN,
	MYS_TESTNET_CHAIN,
	MYS_LOCALNET_CHAIN,
	MYS_MAINNET_CHAIN,
] as const;

export type MysChain = (typeof MYS_CHAINS)[number];

/**
 * Utility that returns whether or not a chain identifier is a valid Mys chain.
 * @param chain a chain identifier in the form of `${string}:{$string}`
 */
export function isMysChain(chain: IdentifierString): chain is MysChain {
	return MYS_CHAINS.includes(chain as MysChain);
}
