// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';
import type { BcsType } from '@socialproof/mys/bcs';

import * as object from './object.js';

export function Field<T0 extends BcsType<any>, T1 extends BcsType<any>>(
	...typeParameters: [T0, T1]
) {
	return bcs.struct('Field', {
		id: object.UID(),
		name: typeParameters[0],
		value: typeParameters[1],
	});
}
