// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { MysClient } from '@mysocial/mys/client';
import type {
	InfiniteData,
	UseInfiniteQueryOptions,
	UseInfiniteQueryResult,
} from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';

import type { PartialBy } from '../types/utilityTypes.js';
import { useMysClientContext } from './useMysClient.js';

interface PaginatedResult {
	data?: unknown;
	nextCursor?: unknown;
	hasNextPage: boolean;
}

export type MysRpcPaginatedMethodName = {
	[K in keyof MysClient]: MysClient[K] extends (input: any) => Promise<PaginatedResult> ? K : never;
}[keyof MysClient];

export type MysRpcPaginatedMethods = {
	[K in MysRpcPaginatedMethodName]: MysClient[K] extends (
		input: infer Params,
	) => Promise<
		infer Result extends { hasNextPage?: boolean | null; nextCursor?: infer Cursor | null }
	>
		? {
				name: K;
				result: Result;
				params: Params;
				cursor: Cursor;
			}
		: never;
};

export type UseMysClientInfiniteQueryOptions<
	T extends keyof MysRpcPaginatedMethods,
	TData,
> = PartialBy<
	Omit<
		UseInfiniteQueryOptions<
			MysRpcPaginatedMethods[T]['result'],
			Error,
			TData,
			MysRpcPaginatedMethods[T]['result'],
			unknown[]
		>,
		'queryFn' | 'initialPageParam' | 'getNextPageParam'
	>,
	'queryKey'
>;

export function useMysClientInfiniteQuery<
	T extends keyof MysRpcPaginatedMethods,
	TData = InfiniteData<MysRpcPaginatedMethods[T]['result']>,
>(
	method: T,
	params: MysRpcPaginatedMethods[T]['params'],
	{
		queryKey = [],
		enabled = !!params,
		...options
	}: UseMysClientInfiniteQueryOptions<T, TData> = {},
): UseInfiniteQueryResult<TData, Error> {
	const mysContext = useMysClientContext();

	return useInfiniteQuery({
		...options,
		initialPageParam: null,
		queryKey: [mysContext.network, method, params, ...queryKey],
		enabled,
		queryFn: ({ pageParam }) =>
			mysContext.client[method]({
				...(params ?? {}),
				cursor: pageParam,
			} as never),
		getNextPageParam: (lastPage) => (lastPage.hasNextPage ? (lastPage.nextCursor ?? null) : null),
	});
}
