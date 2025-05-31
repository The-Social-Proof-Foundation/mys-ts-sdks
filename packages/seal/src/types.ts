// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { ClientWithExtensions, Experimental_CoreClient } from '@mysocial/mys/experimental';

export type KeyCacheKey = `${string}:${string}`;
export type SealCompatibleClient = ClientWithExtensions<{
	core: Experimental_CoreClient;
}>;
