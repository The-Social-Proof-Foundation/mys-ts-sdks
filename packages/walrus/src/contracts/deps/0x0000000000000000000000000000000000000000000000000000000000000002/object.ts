// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';

export function ID() {
	return bcs.struct('ID', {
		bytes: bcs.Address,
	});
}
export function UID() {
	return bcs.struct('UID', {
		id: bcs.Address,
	});
}
