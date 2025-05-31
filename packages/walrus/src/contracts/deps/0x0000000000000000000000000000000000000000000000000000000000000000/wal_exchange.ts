// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/mys/bcs';

import * as balance from '../0x0000000000000000000000000000000000000000000000000000000000000002/balance.js';
import * as object from '../0x0000000000000000000000000000000000000000000000000000000000000002/object.js';

export function Exchange() {
	return bcs.struct('Exchange', {
		id: object.UID(),
		wal: balance.Balance(),
		mys: balance.Balance(),
		rate: ExchangeRate(),
		admin: bcs.Address,
	});
}
export function AdminCap() {
	return bcs.struct('AdminCap', {
		id: object.UID(),
	});
}
export function ExchangeRate() {
	return bcs.struct('ExchangeRate', {
		wal: bcs.u64(),
		mys: bcs.u64(),
	});
}
