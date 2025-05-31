// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { UseQueryResult } from '@tanstack/react-query';
import { useQueries } from '@tanstack/react-query';

import { useMysClientContext } from './useMysClient.js';
import type { MysRpcMethods, UseMysClientQueryOptions } from './useMysClientQuery.js';

type MysClientQueryOptions = MysRpcMethods[keyof MysRpcMethods] extends infer Method
	? Method extends {
			name: infer M extends keyof MysRpcMethods;
			params?: infer P;
		}
		? undefined extends P
			? {
					method: M;
					params?: P;
					options?: UseMysClientQueryOptions<M, unknown>;
				}
			: {
					method: M;
					params: P;
					options?: UseMysClientQueryOptions<M, unknown>;
				}
		: never
	: never;

export type UseMysClientQueriesResults<Args extends readonly MysClientQueryOptions[]> = {
	-readonly [K in keyof Args]: Args[K] extends {
		method: infer M extends keyof MysRpcMethods;
		readonly options?:
			| {
					select?: (...args: any[]) => infer R;
			  }
			| object;
	}
		? UseQueryResult<unknown extends R ? MysRpcMethods[M]['result'] : R>
		: never;
};

export function useMysClientQueries<
	const Queries extends readonly MysClientQueryOptions[],
	Results = UseMysClientQueriesResults<Queries>,
>({
	queries,
	combine,
}: {
	queries: Queries;
	combine?: (results: UseMysClientQueriesResults<Queries>) => Results;
}): Results {
	const mysContext = useMysClientContext();

	return useQueries({
		combine: combine as never,
		queries: queries.map((query) => {
			const { method, params, options: { queryKey = [], ...restOptions } = {} } = query;

			return {
				...restOptions,
				queryKey: [mysContext.network, method, params, ...queryKey],
				queryFn: async () => {
					return await mysContext.client[method](params as never);
				},
			};
		}) as [],
	});
}
