// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';
export function FixedPoint32() {
	return bcs.struct('FixedPoint32', {
		value: bcs.u64(),
	});
}
