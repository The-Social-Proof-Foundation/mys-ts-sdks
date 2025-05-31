// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/mys/bcs';
import * as object from '../0x0000000000000000000000000000000000000000000000000000000000000002/object.js';
export function ExtendedField() {
	return bcs.struct('ExtendedField', {
		id: object.UID(),
	});
}
export function Key() {
	return bcs.struct('Key', {
		dummy_field: bcs.bool(),
	});
}
