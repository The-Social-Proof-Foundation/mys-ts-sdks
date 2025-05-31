// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { MysClient } from '@socialproof/mys/client';
import type {
	UndefinedInitialDataOptions,
	UseQueryOptions,
	UseQueryResult,
} from '@tanstack/react-query';
import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PartialBy } from '../types/utilityTypes.js';
import { useMysClientContext } from './useMysClient.js';

export type MysRpcMethodName = {
	[K in keyof MysClient]: MysClient[K] extends ((input: any) => Promise<any>) | (() => Promise<any>)
		? K
		: never;
}[keyof MysClient];

export type MysRpcMethods = {
	[K in MysRpcMethodName]: MysClient[K] extends (input: infer P) => Promise<infer R>
		? {
				name: K;
				result: R;
				params: P;
			}
		: MysClient[K] extends () => Promise<infer R>
			? {
					name: K;
					result: R;
					params: undefined | object;
				}
			: never;
};

export type UseMysClientQueryOptions<T extends keyof MysRpcMethods, TData> = PartialBy<
	Omit<UseQueryOptions<MysRpcMethods[T]['result'], Error, TData, unknown[]>, 'queryFn'>,
	'queryKey'
>;

export type GetMysClientQueryOptions<T extends keyof MysRpcMethods> = {
	client: MysClient;
	network: string;
	method: T;
	options?: PartialBy<
		Omit<UndefinedInitialDataOptions<MysRpcMethods[T]['result']>, 'queryFn'>,
		'queryKey'
	>;
} & (undefined extends MysRpcMethods[T]['params']
	? { params?: MysRpcMethods[T]['params'] }
	: { params: MysRpcMethods[T]['params'] });

export function getMysClientQuery<T extends keyof MysRpcMethods>({
	client,
	network,
	method,
	params,
	options,
}: GetMysClientQueryOptions<T>) {
	return queryOptions<MysRpcMethods[T]['result']>({
		...options,
		queryKey: [network, method, params],
		queryFn: async () => {
			return await client[method](params as never);
		},
	});
}

export function useMysClientQuery<
	T extends keyof MysRpcMethods,
	TData = MysRpcMethods[T]['result'],
>(
	...args: undefined extends MysRpcMethods[T]['params']
		? [method: T, params?: MysRpcMethods[T]['params'], options?: UseMysClientQueryOptions<T, TData>]
		: [method: T, params: MysRpcMethods[T]['params'], options?: UseMysClientQueryOptions<T, TData>]
): UseQueryResult<TData, Error> {
	const [method, params, { queryKey = [], ...options } = {}] = args as [
		method: T,
		params?: MysRpcMethods[T]['params'],
		options?: UseMysClientQueryOptions<T, TData>,
	];

	const mysContext = useMysClientContext();

	return useQuery({
		...options,
		queryKey: [mysContext.network, method, params, ...queryKey],
		queryFn: async () => {
			return await mysContext.client[method](params as never);
		},
	});
}

export function useMysClientSuspenseQuery<
	T extends keyof MysRpcMethods,
	TData = MysRpcMethods[T]['result'],
>(
	...args: undefined extends MysRpcMethods[T]['params']
		? [method: T, params?: MysRpcMethods[T]['params'], options?: UndefinedInitialDataOptions<TData>]
		: [method: T, params: MysRpcMethods[T]['params'], options?: UndefinedInitialDataOptions<TData>]
) {
	const [method, params, options = {}] = args as [
		method: T,
		params?: MysRpcMethods[T]['params'],
		options?: UndefinedInitialDataOptions<TData>,
	];

	const mysContext = useMysClientContext();

	const query = useMemo(() => {
		return getMysClientQuery<T>({
			client: mysContext.client,
			network: mysContext.network,
			method,
			params,
			options,
		});
	}, [mysContext.client, mysContext.network, method, params, options]);

	return useSuspenseQuery(query);
}
