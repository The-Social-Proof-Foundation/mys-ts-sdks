// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { DAppKitStores } from '../store.js';
import { MysSignPersonalMessage } from '@socialproof/wallet-standard';
import type {
	MysSignPersonalMessageFeature,
	MysSignPersonalMessageInput,
} from '@socialproof/wallet-standard';
import { getWalletAccountForUiWalletAccount_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as getWalletAccountForUiWalletAccount } from '@wallet-standard/ui-registry';
import { WalletNotConnectedError } from '../../utils/errors.js';
import { getChain } from '../../utils/networks.js';
import { getAccountFeature } from '../../utils/wallets.js';

export type SignPersonalMessageArgs = Omit<MysSignPersonalMessageInput, 'account' | 'chain'>;

export function signPersonalMessageCreator({ $connection, $currentNetwork }: DAppKitStores) {
	/**
	 * Prompts the specified wallet account to sign a personal message.
	 */
	return async function signPersonalMessage({ ...standardArgs }: SignPersonalMessageArgs) {
		const { account } = $connection.get();
		if (!account) {
			throw new WalletNotConnectedError('No wallet is connected.');
		}

		const currentNetwork = $currentNetwork.get();
		const chain = getChain(currentNetwork);

		const signPersonalMessageFeature = getAccountFeature({
			account: account,
			chain,
			featureName: MysSignPersonalMessage,
		}) as MysSignPersonalMessageFeature[typeof MysSignPersonalMessage];

		return await signPersonalMessageFeature.signPersonalMessage({
			...standardArgs,
			account: getWalletAccountForUiWalletAccount(account),
			chain,
		});
	};
}
