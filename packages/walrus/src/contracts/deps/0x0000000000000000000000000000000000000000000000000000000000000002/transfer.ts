// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/mys/bcs';

export function Receiving() {
	return bcs.struct('Receiving', {
		id: bcs.Address,
		version: bcs.u64(),
	});
}
