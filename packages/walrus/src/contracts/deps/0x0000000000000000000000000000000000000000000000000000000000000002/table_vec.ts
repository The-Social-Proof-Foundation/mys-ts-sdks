// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';

import * as table from './table.js';

export function TableVec() {
	return bcs.struct('TableVec', {
		contents: table.Table(),
	});
}
