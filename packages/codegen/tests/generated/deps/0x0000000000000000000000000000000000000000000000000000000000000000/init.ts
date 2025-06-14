// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';
import * as object from '../0x0000000000000000000000000000000000000000000000000000000000000002/object.js';
import * as _package from '../0x0000000000000000000000000000000000000000000000000000000000000002/package.js';
export function INIT() {
	return bcs.struct('INIT', {
		dummy_field: bcs.bool(),
	});
}
export function InitCap() {
	return bcs.struct('InitCap', {
		id: object.UID(),
		publisher: _package.Publisher(),
	});
}
