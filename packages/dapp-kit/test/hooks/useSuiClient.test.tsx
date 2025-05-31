// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0
import { getFullnodeUrl, MysClient } from '@socialproof/mys/client';
import { renderHook } from '@testing-library/react';

import { useMysClient } from '../../src/index.js';
import { createMysClientContextWrapper } from '../test-utils.js';

describe('useMysClient', () => {
	test('throws without a MysClientContext', () => {
		expect(() => renderHook(() => useMysClient())).toThrowError(
			'Could not find MysClientContext. Ensure that you have set up the MysClientProvider',
		);
	});

	test('returns a MysClient', () => {
		const mysClient = new MysClient({ url: getFullnodeUrl('localnet') });
		const wrapper = createMysClientContextWrapper(mysClient);
		const { result } = renderHook(() => useMysClient(), { wrapper });

		expect(result.current).toBe(mysClient);
	});
});
