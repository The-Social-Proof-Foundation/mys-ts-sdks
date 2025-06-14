// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0
import { getFullnodeUrl, MysClient } from '@socialproof/mys/client';

import { DeepBookClient } from '../src/index.js'; // Adjust import source accordingly

/// Example to check balance for a balance manager
(async () => {
	const env = 'mainnet';

	const balanceManagers = {
		MANAGER_1: {
			address: '0x344c2734b1d211bd15212bfb7847c66a3b18803f3f5ab00f5ff6f87b6fe6d27d',
			tradeCap: '',
		},
	};

	const dbClient = new DeepBookClient({
		address: '0x0',
		env: env,
		client: new MysClient({
			url: getFullnodeUrl(env),
		}),
		balanceManagers: balanceManagers,
	});

	const assets = ['MYS', 'USDC', 'WUSDT', 'WUSDC', 'BETH', 'DEEP']; // Update assets as needed
	const manager = 'MANAGER_1'; // Update the manager accordingly
	console.log('Manager:', manager);
	for (const asset of assets) {
		console.log(await dbClient.checkManagerBalance(manager, asset));
	}
})();
