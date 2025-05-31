// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0
import { getFullnodeUrl, MysClient } from '@mysocial/mys/client';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useMysClientMutation } from '../../src/hooks/useMysClientMutation.js';
import { createWalletProviderContextWrapper } from '../test-utils.js';

describe('useMysClientMutation', () => {
	it('should fetch data', async () => {
		const mysClient = new MysClient({ url: getFullnodeUrl('mainnet') });
		const wrapper = createWalletProviderContextWrapper({}, mysClient);

		const queryTransactionBlocks = vi.spyOn(mysClient, 'queryTransactionBlocks');

		queryTransactionBlocks.mockResolvedValueOnce({
			data: [{ digest: '0x123' }],
			hasNextPage: true,
			nextCursor: 'page2',
		});

		const { result } = renderHook(() => useMysClientMutation('queryTransactionBlocks'), {
			wrapper,
		});

		act(() => {
			result.current.mutate({
				filter: {
					FromAddress: '0x123',
				},
			});
		});

		await waitFor(() => expect(result.current.status).toBe('success'));

		expect(queryTransactionBlocks).toHaveBeenCalledWith({
			filter: {
				FromAddress: '0x123',
			},
		});
		expect(result.current.isPending).toBe(false);
		expect(result.current.isError).toBe(false);
		expect(result.current.data).toEqual({
			data: [{ digest: '0x123' }],
			hasNextPage: true,
			nextCursor: 'page2',
		});
	});
});
