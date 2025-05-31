// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/mys/bcs';

export function Scalar() {
	return bcs.struct('Scalar', {
		dummy_field: bcs.bool(),
	});
}
export function G1() {
	return bcs.struct('G1', {
		dummy_field: bcs.bool(),
	});
}
export function G2() {
	return bcs.struct('G2', {
		dummy_field: bcs.bool(),
	});
}
export function GT() {
	return bcs.struct('GT', {
		dummy_field: bcs.bool(),
	});
}
export function UncompressedG1() {
	return bcs.struct('UncompressedG1', {
		dummy_field: bcs.bool(),
	});
}
