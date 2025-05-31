// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/mys/bcs';
import type { BcsType } from '@mysocial/mys/bcs';

export function VecSet<T0 extends BcsType<any>>(...typeParameters: [T0]) {
	return bcs.struct('VecSet', {
		contents: bcs.vector(typeParameters[0]),
	});
}
