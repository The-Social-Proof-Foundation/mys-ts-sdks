// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { getFullnodeUrl, MysClient } from '@mysocial/mys/client';
import type { IdentifierRecord, ReadonlyWalletAccount } from '@mysocial/wallet-standard';
import { getWallets } from '@mysocial/wallet-standard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentProps } from 'react';

import { WalletProvider } from '../src/components/WalletProvider.js';
import { MysClientProvider } from '../src/index.js';
import { createMockAccount } from './mocks/mockAccount.js';
import { MockWallet } from './mocks/mockWallet.js';

export function createMysClientContextWrapper(client: MysClient) {
	return function MysClientContextWrapper({ children }: { children: React.ReactNode }) {
		return <MysClientProvider networks={{ test: client }}>{children}</MysClientProvider>;
	};
}

export function createWalletProviderContextWrapper(
	providerProps: Omit<ComponentProps<typeof WalletProvider>, 'children'> = {},
	mysClient: MysClient = new MysClient({ url: getFullnodeUrl('localnet') }),
) {
	const queryClient = new QueryClient();
	return function WalletProviderContextWrapper({ children }: { children: React.ReactNode }) {
		return (
			<MysClientProvider networks={{ test: mysClient }}>
				<QueryClientProvider client={queryClient}>
					<WalletProvider {...providerProps}>{children}</WalletProvider>;
				</QueryClientProvider>
			</MysClientProvider>
		);
	};
}

export function registerMockWallet({
	id,
	walletName,
	accounts = [createMockAccount()],
	features = {},
}: {
	id?: string | null;
	walletName: string;
	accounts?: ReadonlyWalletAccount[];
	features?: IdentifierRecord<unknown>;
}) {
	const walletsApi = getWallets();
	const mockWallet = new MockWallet(id ?? crypto.randomUUID(), walletName, accounts, features);

	return {
		unregister: walletsApi.register(mockWallet),
		mockWallet,
	};
}
