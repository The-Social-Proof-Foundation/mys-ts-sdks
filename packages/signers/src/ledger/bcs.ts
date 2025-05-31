// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs, TypeTagSerializer } from '@socialproof/mys/bcs';
import type { ObjectOwner } from '@socialproof/mys/client';
import {
	fromBase64,
	normalizeStructTag,
	normalizeMysAddress,
	parseStructTag,
} from '@socialproof/mys/utils';

const MYS_FRAMEWORK_ADDRESS = normalizeMysAddress('0x2');
const MYS_SYSTEM_ADDRESS = normalizeMysAddress('0x3');

const MoveObjectType = bcs.enum('MoveObjectType', {
	Other: bcs.StructTag,
	GasCoin: null,
	StakedMys: null,
	Coin: bcs.TypeTag,
});

export const MysMoveObject = bcs.struct('MysMoveObject', {
	data: bcs.enum('Data', {
		MoveObject: bcs.struct('MoveObject', {
			type: MoveObjectType.transform({
				input: (objectType: string): typeof MoveObjectType.$inferType => {
					const structTag = parseStructTag(objectType);

					if (
						structTag.address === MYS_FRAMEWORK_ADDRESS &&
						structTag.module === 'coin' &&
						structTag.name === 'Coin' &&
						typeof structTag.typeParams[0] === 'object'
					) {
						const innerStructTag = structTag.typeParams[0];
						if (
							innerStructTag.address === MYS_FRAMEWORK_ADDRESS &&
							innerStructTag.module === 'mys' &&
							innerStructTag.name === 'MYS'
						) {
							return { GasCoin: true, $kind: 'GasCoin' };
						}
						return { Coin: normalizeStructTag(innerStructTag), $kind: 'Coin' };
					} else if (
						structTag.address === MYS_SYSTEM_ADDRESS &&
						structTag.module === 'staking_pool' &&
						structTag.name === 'StakedMys'
					) {
						return { StakedMys: true, $kind: 'StakedMys' };
					}
					return {
						Other: {
							...structTag,
							typeParams: structTag.typeParams.map((typeParam) => {
								return TypeTagSerializer.parseFromStr(normalizeStructTag(typeParam));
							}),
						},
						$kind: 'Other',
					};
				},
			}),
			hasPublicTransfer: bcs.bool(),
			version: bcs.u64(),
			contents: bcs.byteVector().transform({ input: fromBase64 }),
		}),
	}),
	owner: bcs.Owner.transform({
		input: (objectOwner: ObjectOwner) => {
			if (objectOwner === 'Immutable') {
				return { Immutable: null };
			} else if ('Shared' in objectOwner) {
				return { Shared: { initialSharedVersion: objectOwner.Shared.initial_shared_version } };
			} else if ('ConsensusV2' in objectOwner) {
				return {
					ConsensusV2: {
						authenticator: objectOwner.ConsensusV2.authenticator,
						startVersion: objectOwner.ConsensusV2.start_version,
					},
				};
			}
			return objectOwner;
		},
	}),
	previousTransaction: bcs.ObjectDigest,
	storageRebate: bcs.u64(),
});
