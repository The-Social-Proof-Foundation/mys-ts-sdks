// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/mys/bcs';
import * as object from '../0x0000000000000000000000000000000000000000000000000000000000000002/object.js';
import * as storage_resource from '../../storage_resource.js';
export function Blob() {
	return bcs.struct('Blob', {
		id: object.UID(),
		registered_epoch: bcs.u32(),
		blob_id: bcs.u256(),
		size: bcs.u64(),
		encoding_type: bcs.u8(),
		certified_epoch: bcs.option(bcs.u32()),
		storage: storage_resource.Storage(),
		deletable: bcs.bool(),
	});
}
export function BlobIdDerivation() {
	return bcs.struct('BlobIdDerivation', {
		encoding_type: bcs.u8(),
		size: bcs.u64(),
		root_hash: bcs.u256(),
	});
}
