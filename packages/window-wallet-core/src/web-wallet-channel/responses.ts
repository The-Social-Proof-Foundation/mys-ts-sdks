// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import * as v from 'valibot';

export const ResponseData = v.variant('type', [
	v.object({
		type: v.literal('connect'),
		session: v.string('`session` is required'),
	}),
	v.object({
		type: v.literal('sign-transaction'),
		bytes: v.string(),
		signature: v.string(),
	}),
	v.object({
		type: v.literal('sign-and-execute-transaction'),
		bytes: v.string(),
		signature: v.string(),
		digest: v.string(),
		effects: v.string(),
	}),
	v.object({
		type: v.literal('sign-personal-message'),
		bytes: v.string(),
		signature: v.string(),
	}),
]);
export type ResponseDataType = v.InferOutput<typeof ResponseData>;

export const ResponsePayload = v.variant('type', [
	v.object({
		type: v.literal('reject'),
		reason: v.optional(v.string('`reason` must be a string')),
	}),
	v.object({
		type: v.literal('resolve'),
		data: ResponseData,
	}),
]);
export type ResponsePayloadType = v.InferOutput<typeof ResponsePayload>;

export const Response = v.object({
	id: v.pipe(v.string(), v.uuid()),
	source: v.literal('web-wallet-channel'),
	payload: ResponsePayload,
	version: v.literal('1'),
});
export type ResponseType = v.InferOutput<typeof Response>;

export type ResponseTypes = {
	[P in ResponseDataType as P['type']]: P;
};
