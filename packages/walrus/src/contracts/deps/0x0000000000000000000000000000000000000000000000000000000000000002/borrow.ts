// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/mys/bcs';
import type { BcsType } from '@mysocial/mys/bcs';

export function Referent<T0 extends BcsType<any>>(...typeParameters: [T0]) {
	return bcs.struct('Referent', {
		id: bcs.Address,
		value: bcs.option(typeParameters[0]),
	});
}
export function Borrow() {
	return bcs.struct('Borrow', {
		ref: bcs.Address,
		obj: bcs.Address,
	});
}
