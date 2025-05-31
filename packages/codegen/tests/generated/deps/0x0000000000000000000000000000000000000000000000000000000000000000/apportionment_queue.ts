// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs, type BcsType } from '@mysocial/mys/bcs';
import * as uq64_64 from '../0x0000000000000000000000000000000000000000000000000000000000000001/uq64_64.js';
export function ApportionmentQueue<T0 extends BcsType<any>>(...typeParameters: [T0]) {
	return bcs.struct('ApportionmentQueue', {
		entries: bcs.vector(Entry(typeParameters[0])),
	});
}
export function Entry<T0 extends BcsType<any>>(...typeParameters: [T0]) {
	return bcs.struct('Entry', {
		priority: uq64_64.UQ64_64(),
		tie_breaker: bcs.u64(),
		value: typeParameters[0],
	});
}
