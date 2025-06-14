// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { base58 } from '@scure/base';

export const toBase58 = (buffer: Uint8Array) => base58.encode(buffer);
export const fromBase58 = (str: string) => base58.decode(str);
