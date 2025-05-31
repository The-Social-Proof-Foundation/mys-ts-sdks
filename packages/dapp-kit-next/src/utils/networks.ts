// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { Experimental_SuiClientTypes } from '@mysocial/sui/experimental';
import type { IdentifierString } from '@mysocial/wallet-standard';

type NonEmptyArray<T> = readonly [T, ...T[]] | readonly [...T[], T] | readonly [T, ...T[], T];

export type Networks = NonEmptyArray<Experimental_SuiClientTypes.Network>;

export function getChain(network: Experimental_SuiClientTypes.Network): IdentifierString {
	return `sui:${network}`;
}
