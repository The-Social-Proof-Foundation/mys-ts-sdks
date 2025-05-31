// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';
export function Authenticated() {
	return bcs.enum('Authenticated', {
		Sender: bcs.Address,
		Object: bcs.Address,
	});
}
export function Authorized() {
	return bcs.enum('Authorized', {
		Address: bcs.Address,
		ObjectID: bcs.Address,
	});
}
