// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';

export function Supply() {
	return bcs.struct('Supply', {
		value: bcs.u64(),
	});
}
export function Balance() {
	return bcs.struct('Balance', {
		value: bcs.u64(),
	});
}
