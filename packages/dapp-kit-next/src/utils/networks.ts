// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { Experimental_MysClientTypes } from '@mysocial/mys/experimental';
import type { IdentifierString } from '@mysocial/wallet-standard';

type NonEmptyArray<T> = readonly [T, ...T[]] | readonly [...T[], T] | readonly [T, ...T[], T];

export type Networks = NonEmptyArray<Experimental_MysClientTypes.Network>;

export function getChain(network: Experimental_MysClientTypes.Network): IdentifierString {
	return `mys:${network}`;
}
