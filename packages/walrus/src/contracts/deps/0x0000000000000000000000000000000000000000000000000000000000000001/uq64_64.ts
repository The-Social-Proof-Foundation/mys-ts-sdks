// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';

export function UQ64_64() {
	return bcs.struct('UQ64_64', {
		pos0: bcs.u128(),
	});
}
