// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';

export function PCREntry() {
	return bcs.struct('PCREntry', {
		index: bcs.u8(),
		value: bcs.vector(bcs.u8()),
	});
}
export function NitroAttestationDocument() {
	return bcs.struct('NitroAttestationDocument', {
		module_id: bcs.vector(bcs.u8()),
		timestamp: bcs.u64(),
		digest: bcs.vector(bcs.u8()),
		pcrs: bcs.vector(PCREntry()),
		public_key: bcs.option(bcs.vector(bcs.u8())),
		user_data: bcs.option(bcs.vector(bcs.u8())),
		nonce: bcs.option(bcs.vector(bcs.u8())),
	});
}
