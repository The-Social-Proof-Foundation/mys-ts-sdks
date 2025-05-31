// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/mys/bcs';

export function MYS() {
	return bcs.struct('MYS', {
		dummy_field: bcs.bool(),
	});
}
