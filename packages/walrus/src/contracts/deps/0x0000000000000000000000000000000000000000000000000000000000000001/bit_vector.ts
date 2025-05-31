// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';

export function BitVector() {
	return bcs.struct('BitVector', {
		length: bcs.u64(),
		bit_field: bcs.vector(bcs.bool()),
	});
}
