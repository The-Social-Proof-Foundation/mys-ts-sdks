// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { createContext } from 'react';

import type { WalletStore } from '../walletStore.js';

export const WalletContext = createContext<WalletStore | null>(null);
