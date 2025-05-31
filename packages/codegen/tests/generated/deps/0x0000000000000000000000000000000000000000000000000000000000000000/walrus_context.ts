// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/mys/bcs';
import * as vec_map from '../0x0000000000000000000000000000000000000000000000000000000000000002/vec_map.js';
export function WalrusContext() {
	return bcs.struct('WalrusContext', {
		epoch: bcs.u32(),
		committee_selected: bcs.bool(),
		committee: vec_map.VecMap(bcs.Address, bcs.vector(bcs.u16())),
	});
}
