// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { WalletWithRequiredFeatures } from '@socialproof/wallet-standard';

import { getWalletUniqueIdentifier } from '../../../utils/walletUtils.js';
import { MysIcon } from '../../icons/MysIcon.js';
import * as styles from './WalletList.css.js';
import { WalletListItem } from './WalletListItem.js';

type WalletListProps = {
	selectedWalletName?: string;
	onPlaceholderClick: () => void;
	onSelect: (wallet: WalletWithRequiredFeatures) => void;
	wallets: WalletWithRequiredFeatures[];
};

export function WalletList({
	selectedWalletName,
	onPlaceholderClick,
	onSelect,
	wallets,
}: WalletListProps) {
	return (
		<ul className={styles.container}>
			{wallets.length > 0 ? (
				wallets.map((wallet) => (
					<WalletListItem
						key={getWalletUniqueIdentifier(wallet)}
						name={wallet.name}
						icon={wallet.icon}
						isSelected={getWalletUniqueIdentifier(wallet) === selectedWalletName}
						onClick={() => onSelect(wallet)}
					/>
				))
			) : (
				<WalletListItem
					name="Mys Wallet"
					icon={<MysIcon />}
					onClick={onPlaceholderClick}
					isSelected
				/>
			)}
		</ul>
	);
}
