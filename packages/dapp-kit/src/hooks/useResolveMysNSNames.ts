// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { ResolvedNameServiceNames } from '@mysocial/mys/client';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

import { useMysClientQuery } from './useMysClientQuery.js';

export function useResolveMysNSName(
	address?: string | null,
	options?: Omit<
		UseQueryOptions<ResolvedNameServiceNames, Error, string | null, unknown[]>,
		'queryFn' | 'queryKey' | 'select'
	>,
): UseQueryResult<string | null, Error> {
	return useMysClientQuery(
		'resolveNameServiceNames',
		{
			address: address!,
			limit: 1,
		},
		{
			...options,
			refetchOnWindowFocus: false,
			retry: false,
			select: (data) => (data.data.length > 0 ? data.data[0] : null),
			enabled: !!address && options?.enabled !== false,
		},
	);
}
