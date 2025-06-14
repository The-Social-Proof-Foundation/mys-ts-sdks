// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { MysClient } from '@socialproof/mys/client';
import type { StandardEventsListeners } from '@socialproof/wallet-standard';

import type { EnokiClientConfig } from '../EnokiClient/index.js';
import type { AuthProvider, EnokiNetwork } from '../EnokiClient/type.js';

export type WalletEventsMap = {
	[E in keyof StandardEventsListeners]: Parameters<StandardEventsListeners[E]>[0];
};

export interface RegisterEnokiWalletsOptions extends EnokiClientConfig {
	/**
	 * Configuration for each OAuth provider.
	 */
	providers: Partial<
		Record<
			AuthProvider,
			{
				/**
				 * The OAuth client ID.
				 */
				clientId: string;

				/**
				 * The URL to redirect to after authorization.
				 */
				redirectUrl?: string;

				/**
				 * Extra parameters to include in the authorization URL.
				 */
				extraParams?: Record<string, string>;
			}
		>
	>;

	/**
	 * The MysClient instance to use when building and executing transactions.
	 */
	client: MysClient;

	/**
	 * The network to use when building and executing transactions.
	 * @default 'mainnet'
	 */
	network?: EnokiNetwork;

	/**
	 * The window features to use when opening the authorization popup.
	 * https://developer.mozilla.org/en-US/docs/Web/API/Window/open#windowfeatures
	 */
	windowFeatures?: string | (() => string);
}
