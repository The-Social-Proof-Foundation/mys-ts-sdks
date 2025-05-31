// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs, type BcsType } from '@socialproof/mys/bcs';
export function Wrapper<T0 extends BcsType<any>>(...typeParameters: [T0]) {
	return bcs.struct('Wrapper', {
		name: typeParameters[0],
	});
}
