// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/sui/bcs';
import type { BcsType } from '@mysocial/sui/bcs';

import * as object from './object.js';

export function Config() {
	return bcs.struct('Config', {
		id: object.UID(),
	});
}
export function Setting<T0 extends BcsType<any>>(...typeParameters: [T0]) {
	return bcs.struct('Setting', {
		data: bcs.option(SettingData(typeParameters[0])),
	});
}
export function SettingData<T0 extends BcsType<any>>(...typeParameters: [T0]) {
	return bcs.struct('SettingData', {
		newer_value_epoch: bcs.u64(),
		newer_value: bcs.option(typeParameters[0]),
		older_value_opt: bcs.option(typeParameters[0]),
	});
}
