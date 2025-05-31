// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { toBase64 } from '@socialproof/bcs';
import type { SerializedBcs } from '@socialproof/bcs';

import { normalizeMysAddress } from '../utils/mys-types.js';
import type { CallArg, ObjectRef } from './data/internal.js';

function Pure(data: Uint8Array | SerializedBcs<any>): Extract<CallArg, { Pure: unknown }> {
	return {
		$kind: 'Pure',
		Pure: {
			bytes: data instanceof Uint8Array ? toBase64(data) : data.toBase64(),
		},
	};
}

export const Inputs = {
	Pure,
	ObjectRef({ objectId, digest, version }: ObjectRef): Extract<CallArg, { Object: unknown }> {
		return {
			$kind: 'Object',
			Object: {
				$kind: 'ImmOrOwnedObject',
				ImmOrOwnedObject: {
					digest,
					version,
					objectId: normalizeMysAddress(objectId),
				},
			},
		};
	},
	SharedObjectRef({
		objectId,
		mutable,
		initialSharedVersion,
	}: {
		objectId: string;
		mutable: boolean;
		initialSharedVersion: number | string;
	}): Extract<CallArg, { Object: unknown }> {
		return {
			$kind: 'Object',
			Object: {
				$kind: 'SharedObject',
				SharedObject: {
					mutable,
					initialSharedVersion,
					objectId: normalizeMysAddress(objectId),
				},
			},
		};
	},
	ReceivingRef({ objectId, digest, version }: ObjectRef): Extract<CallArg, { Object: unknown }> {
		return {
			$kind: 'Object',
			Object: {
				$kind: 'Receiving',
				Receiving: {
					digest,
					version,
					objectId: normalizeMysAddress(objectId),
				},
			},
		};
	},
};
