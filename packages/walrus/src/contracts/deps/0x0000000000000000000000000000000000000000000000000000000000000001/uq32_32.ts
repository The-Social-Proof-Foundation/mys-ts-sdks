// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/sui/bcs';

export function UQ32_32() {
	return bcs.struct('UQ32_32', {
		pos0: bcs.u64(),
	});
}
