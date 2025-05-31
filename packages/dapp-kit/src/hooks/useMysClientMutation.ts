// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

import { useMysClientContext } from './useMysClient.js';
import type { MysRpcMethods } from './useMysClientQuery.js';

export type UseMysClientMutationOptions<T extends keyof MysRpcMethods> = Omit<
	UseMutationOptions<MysRpcMethods[T]['result'], Error, MysRpcMethods[T]['params'], unknown[]>,
	'mutationFn'
>;

export function useMysClientMutation<T extends keyof MysRpcMethods>(
	method: T,
	options: UseMysClientMutationOptions<T> = {},
): UseMutationResult<MysRpcMethods[T]['result'], Error, MysRpcMethods[T]['params'], unknown[]> {
	const mysContext = useMysClientContext();

	return useMutation({
		...options,
		mutationFn: async (params) => {
			return await mysContext.client[method](params as never);
		},
	});
}
