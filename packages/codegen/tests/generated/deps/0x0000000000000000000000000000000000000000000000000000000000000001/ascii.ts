// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';
export function String() {
	return bcs.struct('String', {
		bytes: bcs.vector(bcs.u8()),
	});
}
export function Char() {
	return bcs.struct('Char', {
		byte: bcs.u8(),
	});
}
