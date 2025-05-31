// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { MysClientProvider, WalletProvider } from '@mysocial/dapp-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom/client';

import '@mysocial/dapp-kit/dist/index.css';

import { getFullnodeUrl } from '../../typescript/src/client/network.ts';
import { App } from './App.tsx';
import { RegisterEnokiWallets } from './RegisterEnokiWallets.tsx';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<MysClientProvider
				networks={{
					testnet: {
						url: getFullnodeUrl('testnet'),
					},
					localnet: {
						url: 'http://localhost:8000',
					},
				}}
			>
				<RegisterEnokiWallets />
				<WalletProvider autoConnect>
					<App />
				</WalletProvider>
			</MysClientProvider>
		</QueryClientProvider>
	</React.StrictMode>,
);
