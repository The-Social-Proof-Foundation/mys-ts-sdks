// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { is } from 'valibot';

import type { MysMoveNormalizedType } from '../client/index.js';
import { normalizeMysAddress } from '../utils/mys-types.js';
import { Argument } from './data/internal.js';
import type { CallArg } from './data/internal.js';

export function extractMutableReference(
	normalizedType: MysMoveNormalizedType,
): MysMoveNormalizedType | undefined {
	return typeof normalizedType === 'object' && 'MutableReference' in normalizedType
		? normalizedType.MutableReference
		: undefined;
}

export function extractReference(
	normalizedType: MysMoveNormalizedType,
): MysMoveNormalizedType | undefined {
	return typeof normalizedType === 'object' && 'Reference' in normalizedType
		? normalizedType.Reference
		: undefined;
}

export function extractStructTag(
	normalizedType: MysMoveNormalizedType,
): Extract<MysMoveNormalizedType, { Struct: unknown }> | undefined {
	if (typeof normalizedType === 'object' && 'Struct' in normalizedType) {
		return normalizedType;
	}

	const ref = extractReference(normalizedType);
	const mutRef = extractMutableReference(normalizedType);

	if (typeof ref === 'object' && 'Struct' in ref) {
		return ref;
	}

	if (typeof mutRef === 'object' && 'Struct' in mutRef) {
		return mutRef;
	}
	return undefined;
}

export function getIdFromCallArg(arg: string | CallArg) {
	if (typeof arg === 'string') {
		return normalizeMysAddress(arg);
	}

	if (arg.Object) {
		if (arg.Object.ImmOrOwnedObject) {
			return normalizeMysAddress(arg.Object.ImmOrOwnedObject.objectId);
		}

		if (arg.Object.Receiving) {
			return normalizeMysAddress(arg.Object.Receiving.objectId);
		}

		return normalizeMysAddress(arg.Object.SharedObject.objectId);
	}

	if (arg.UnresolvedObject) {
		return normalizeMysAddress(arg.UnresolvedObject.objectId);
	}

	return undefined;
}

export function isArgument(value: unknown): value is Argument {
	return is(Argument, value);
}
