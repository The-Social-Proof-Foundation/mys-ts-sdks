// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/mys/bcs';

import * as object from '../0x0000000000000000000000000000000000000000000000000000000000000002/object.js';

export function WAL() {
	return bcs.struct('WAL', {
		dummy_field: bcs.bool(),
	});
}
export function ProtectedTreasury() {
	return bcs.struct('ProtectedTreasury', {
		id: object.UID(),
	});
}
export function TreasuryCapKey() {
	return bcs.struct('TreasuryCapKey', {
		dummy_field: bcs.bool(),
	});
}
