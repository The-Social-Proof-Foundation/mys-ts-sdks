// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { useStore } from '@nanostores/react';
import { createDAppKit } from '@socialproof/dapp-kit-next';
import { getFullnodeUrl, MysClient } from '@socialproof/mys/client';

const dAppKit = createDAppKit({
	networks: ['mainnet', 'testnet'],
	defaultNetwork: 'testnet',
	createClient(network) {
		return new MysClient({ network, url: getFullnodeUrl(network) });
	},
});

function App() {
	const wallets = useStore(dAppKit.stores.$wallets);

	return (
		<div>
			<p>TODO: Flesh this out more / make it more use case specific ^.^</p>
			{wallets.length > 0 ? (
				<ul>
					{wallets.map((wallet) => (
						<li key={wallet.name}>{wallet.name}</li>
					))}
				</ul>
			) : (
				<p>No registered wallets</p>
			)}
		</div>
	);
}

export default App;
