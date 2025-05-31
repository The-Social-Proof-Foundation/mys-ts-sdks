// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { MysClient } from '@mysocial/mys/client';
import { useContext } from 'react';

import { MysClientContext } from '../components/MysClientProvider.js';

export function useMysClientContext() {
	const mysClient = useContext(MysClientContext);

	if (!mysClient) {
		throw new Error(
			'Could not find MysClientContext. Ensure that you have set up the MysClientProvider',
		);
	}

	return mysClient;
}

export function useMysClient(): MysClient {
	return useMysClientContext().client;
}
