// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';

import * as object from './object.js';

export function ObjectBag() {
	return bcs.struct('ObjectBag', {
		id: object.UID(),
		size: bcs.u64(),
	});
}
