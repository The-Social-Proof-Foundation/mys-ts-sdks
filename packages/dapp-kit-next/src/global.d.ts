// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { DAppKit } from './core/index.js';

declare global {
	var __DEFAULT_DAPP_KIT_INSTANCE__: DAppKit | undefined;
}
