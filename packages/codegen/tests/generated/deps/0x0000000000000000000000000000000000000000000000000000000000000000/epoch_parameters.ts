// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/mys/bcs';
export function EpochParams() {
	return bcs.struct('EpochParams', {
		total_capacity_size: bcs.u64(),
		storage_price_per_unit_size: bcs.u64(),
		write_price_per_unit_size: bcs.u64(),
	});
}
