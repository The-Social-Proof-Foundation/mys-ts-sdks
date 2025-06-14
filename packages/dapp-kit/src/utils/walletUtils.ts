// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type {
	MinimallyRequiredFeatures,
	Wallet,
	WalletWithFeatures,
	WalletWithRequiredFeatures,
} from '@socialproof/wallet-standard';
import { getWallets, isWalletWithRequiredFeatureSet } from '@socialproof/wallet-standard';

export function getRegisteredWallets<AdditionalFeatures extends Wallet['features']>(
	preferredWallets: string[],
	walletFilter?: (wallet: WalletWithRequiredFeatures) => boolean,
) {
	const walletsApi = getWallets();
	const wallets = walletsApi.get();

	const mysWallets = wallets.filter(
		(wallet): wallet is WalletWithFeatures<MinimallyRequiredFeatures & AdditionalFeatures> =>
			isWalletWithRequiredFeatureSet(wallet) && (!walletFilter || walletFilter(wallet)),
	);

	return [
		// Preferred wallets, in order:
		...(preferredWallets
			.map((name) => mysWallets.find((wallet) => wallet.name === name))
			.filter(Boolean) as WalletWithFeatures<MinimallyRequiredFeatures & AdditionalFeatures>[]),

		// Wallets in default order:
		...mysWallets.filter((wallet) => !preferredWallets.includes(wallet.name)),
	];
}

export function getWalletUniqueIdentifier(wallet?: Wallet) {
	return wallet?.id ?? wallet?.name;
}
