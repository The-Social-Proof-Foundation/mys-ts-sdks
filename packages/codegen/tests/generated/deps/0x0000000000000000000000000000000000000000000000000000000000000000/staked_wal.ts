// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';
import * as object from '../0x0000000000000000000000000000000000000000000000000000000000000002/object.js';
import * as balance from '../0x0000000000000000000000000000000000000000000000000000000000000002/balance.js';
export function StakedWal() {
	return bcs.struct('StakedWal', {
		id: object.UID(),
		state: StakedWalState(),
		node_id: bcs.Address,
		principal: balance.Balance(),
		activation_epoch: bcs.u32(),
	});
}
export function StakedWalState() {
	return bcs.enum('StakedWalState', {
		Staked: null,
		Withdrawing: bcs.u32(),
	});
}
