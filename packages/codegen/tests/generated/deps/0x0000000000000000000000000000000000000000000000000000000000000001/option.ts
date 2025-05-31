// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs, type BcsType } from '@socialproof/mys/bcs';
export function Option<T0 extends BcsType<any>>(...typeParameters: [T0]) {
	return bcs.struct('Option', {
		vec: bcs.vector(typeParameters[0]),
	});
}
