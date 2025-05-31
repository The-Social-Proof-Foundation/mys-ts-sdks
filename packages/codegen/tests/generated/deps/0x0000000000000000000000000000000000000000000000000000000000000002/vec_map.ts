// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs, type BcsType } from '@mysocial/sui/bcs';
export function VecMap<T0 extends BcsType<any>, T1 extends BcsType<any>>(
	...typeParameters: [T0, T1]
) {
	return bcs.struct('VecMap', {
		contents: bcs.vector(Entry(typeParameters[0], typeParameters[1])),
	});
}
export function Entry<T0 extends BcsType<any>, T1 extends BcsType<any>>(
	...typeParameters: [T0, T1]
) {
	return bcs.struct('Entry', {
		key: typeParameters[0],
		value: typeParameters[1],
	});
}
