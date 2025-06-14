// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { WalletWithFeatures, WalletWithRequiredFeatures } from '@socialproof/wallet-standard';
import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { StateStorage } from 'zustand/middleware';

import {
	DEFAULT_PREFERRED_WALLETS,
	DEFAULT_STORAGE,
	DEFAULT_STORAGE_KEY,
	DEFAULT_WALLET_FILTER,
} from '../constants/walletDefaults.js';
import { WalletContext } from '../contexts/walletContext.js';
import { useAutoConnectWallet } from '../hooks/wallet/useAutoConnectWallet.js';
import type { SlushWalletConfig } from '../hooks/wallet/useSlushWallet.js';
import { useSlushWallet } from '../hooks/wallet/useSlushWallet.js';
import { useUnsafeBurnerWallet } from '../hooks/wallet/useUnsafeBurnerWallet.js';
import { useWalletPropertiesChanged } from '../hooks/wallet/useWalletPropertiesChanged.js';
import { useWalletsChanged } from '../hooks/wallet/useWalletsChanged.js';
import { lightTheme } from '../themes/lightTheme.js';
import type { Theme } from '../themes/themeContract.js';
import { createInMemoryStore } from '../utils/stateStorage.js';
import { getRegisteredWallets } from '../utils/walletUtils.js';
import { createWalletStore } from '../walletStore.js';
import { InjectedThemeStyles } from './styling/InjectedThemeStyles.js';

export type WalletProviderProps = {
	/** A list of wallets that are sorted to the top of the wallet list, if they are available to connect to. By default, wallets are sorted by the order they are loaded in. */
	preferredWallets?: string[];

	/** A filter function to select wallets that support features required for the dApp to function. This filters the list of wallets presented to users when selecting a wallet to connect from, ensuring that only wallets that meet the dApps requirements can connect. */
	walletFilter?: (wallet: WalletWithRequiredFeatures) => boolean;

	/** Enables the development-only unsafe burner wallet, which can be useful for testing. */
	enableUnsafeBurner?: boolean;

	/** Enables automatically reconnecting to the most recently used wallet account upon mounting. */
	autoConnect?: boolean;

	/** Enables the Slush wallet */
	slushWallet?: SlushWalletConfig;

	/** Configures how the most recently connected to wallet account is stored. Set to `null` to disable persisting state entirely. Defaults to using localStorage if it is available. */
	storage?: StateStorage | null;

	/** The key to use to store the most recently connected wallet account. */
	storageKey?: string;

	/** The theme to use for styling UI components. Defaults to using the light theme. */
	theme?: Theme | null;

	children: ReactNode;
};

export type { WalletWithFeatures };

export function WalletProvider({
	preferredWallets = DEFAULT_PREFERRED_WALLETS,
	walletFilter = DEFAULT_WALLET_FILTER,
	storage = DEFAULT_STORAGE,
	storageKey = DEFAULT_STORAGE_KEY,
	enableUnsafeBurner = false,
	autoConnect = false,
	slushWallet,
	theme = lightTheme,
	children,
}: WalletProviderProps) {
	const storeRef = useRef(
		createWalletStore({
			autoConnectEnabled: autoConnect,
			wallets: getRegisteredWallets(preferredWallets, walletFilter),
			storage: storage || createInMemoryStore(),
			storageKey,
		}),
	);

	return (
		<WalletContext.Provider value={storeRef.current}>
			<WalletConnectionManager
				preferredWallets={preferredWallets}
				walletFilter={walletFilter}
				enableUnsafeBurner={enableUnsafeBurner}
				slushWallet={slushWallet}
			>
				{/* TODO: We ideally don't want to inject styles if people aren't using the UI components */}
				{theme ? <InjectedThemeStyles theme={theme} /> : null}
				{children}
			</WalletConnectionManager>
		</WalletContext.Provider>
	);
}

type WalletConnectionManagerProps = Pick<
	WalletProviderProps,
	'preferredWallets' | 'walletFilter' | 'enableUnsafeBurner' | 'slushWallet' | 'children'
>;

function WalletConnectionManager({
	preferredWallets = DEFAULT_PREFERRED_WALLETS,
	walletFilter = DEFAULT_WALLET_FILTER,
	enableUnsafeBurner = false,
	slushWallet,
	children,
}: WalletConnectionManagerProps) {
	useWalletsChanged(preferredWallets, walletFilter);
	useWalletPropertiesChanged();
	useSlushWallet(slushWallet);
	useUnsafeBurnerWallet(enableUnsafeBurner);
	useAutoConnectWallet();

	return children;
}
