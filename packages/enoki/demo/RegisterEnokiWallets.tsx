// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { useMysClientContext } from '@socialproof/dapp-kit';
import { useEffect } from 'react';

import { isEnokiNetwork } from '../src/index.js';
import { registerEnokiWallets } from '../src/wallet/index.js';

export function RegisterEnokiWallets() {
	const { client, network } = useMysClientContext();

	useEffect(() => {
		if (!isEnokiNetwork(network)) return;

		const { unregister } = registerEnokiWallets({
			apiKey: 'enoki_public_b995248de4faffd13864f12cd8539a8d',
			providers: {
				google: {
					clientId: '705781974144-cltddr1ggjnuc3kaimtc881r2n5bderc.apps.googleusercontent.com',
				},
				facebook: {
					clientId: '705781974144-cltddr1ggjnuc3kaimtc881r2n5bderc.apps.googleusercontent.com',
				},
				twitch: {
					clientId: '705781974144-cltddr1ggjnuc3kaimtc881r2n5bderc.apps.googleusercontent.com',
				},
			},
			client: client as never,
			network,
		});

		return unregister;
	}, [client, network]);

	return null;
}
