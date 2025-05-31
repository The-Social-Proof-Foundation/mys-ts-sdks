// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/sui/bcs';
export function SUI() {
	return bcs.struct('SUI', {
		dummy_field: bcs.bool(),
	});
}
