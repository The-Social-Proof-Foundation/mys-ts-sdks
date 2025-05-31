// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { IdentifierRecord, MysFeatures, MysSignMessageFeature } from '@socialproof/wallet-standard';

export const signMessageFeature: MysSignMessageFeature = {
	'mys:signMessage': {
		version: '1.0.0',
		signMessage: vi.fn(),
	},
};

export const superCoolFeature: IdentifierRecord<unknown> = {
	'my-dapp:super-cool-feature': {
		version: '1.0.0',
		superCoolFeature: vi.fn(),
	},
};

export const mysFeatures: MysFeatures = {
	...signMessageFeature,
	'mys:signPersonalMessage': {
		version: '1.1.0',
		signPersonalMessage: vi.fn(),
	},
	'mys:signTransactionBlock': {
		version: '1.0.0',
		signTransactionBlock: vi.fn(),
	},
	'mys:signTransaction': {
		version: '2.0.0',
		signTransaction: vi.fn(),
	},
	'mys:signAndExecuteTransactionBlock': {
		version: '1.0.0',
		signAndExecuteTransactionBlock: vi.fn(),
	},
	'mys:signAndExecuteTransaction': {
		version: '2.0.0',
		signAndExecuteTransaction: vi.fn(),
	},
	'mys:reportTransactionEffects': {
		version: '1.0.0',
		reportTransactionEffects: vi.fn(),
	},
};
