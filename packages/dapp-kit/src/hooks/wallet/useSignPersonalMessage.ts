// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type {
	MysSignPersonalMessageInput,
	MysSignPersonalMessageOutput,
} from '@socialproof/wallet-standard';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

import {
	WalletFeatureNotSupportedError,
	WalletNoAccountSelectedError,
	WalletNotConnectedError,
} from '../..//errors/walletErrors.js';
import { walletMutationKeys } from '../../constants/walletMutationKeys.js';
import type { PartialBy } from '../../types/utilityTypes.js';
import { useMysClientContext } from '../useMysClient.js';
import { useCurrentAccount } from './useCurrentAccount.js';
import { useCurrentWallet } from './useCurrentWallet.js';

type UseSignPersonalMessageArgs = PartialBy<MysSignPersonalMessageInput, 'account' | 'chain'>;

type UseSignPersonalMessageResult = MysSignPersonalMessageOutput;

type UseSignPersonalMessageError =
	| WalletFeatureNotSupportedError
	| WalletNoAccountSelectedError
	| WalletNotConnectedError
	| Error;

type UseSignPersonalMessageMutationOptions = Omit<
	UseMutationOptions<
		UseSignPersonalMessageResult,
		UseSignPersonalMessageError,
		UseSignPersonalMessageArgs,
		unknown
	>,
	'mutationFn'
>;

/**
 * Mutation hook for prompting the user to sign a message.
 */
export function useSignPersonalMessage({
	mutationKey,
	...mutationOptions
}: UseSignPersonalMessageMutationOptions = {}): UseMutationResult<
	UseSignPersonalMessageResult,
	UseSignPersonalMessageError,
	UseSignPersonalMessageArgs
> {
	const { currentWallet } = useCurrentWallet();
	const currentAccount = useCurrentAccount();
	const { network } = useMysClientContext();

	return useMutation({
		mutationKey: walletMutationKeys.signPersonalMessage(mutationKey),
		mutationFn: async (signPersonalMessageArgs) => {
			if (!currentWallet) {
				throw new WalletNotConnectedError('No wallet is connected.');
			}

			const signerAccount = signPersonalMessageArgs.account ?? currentAccount;
			if (!signerAccount) {
				throw new WalletNoAccountSelectedError(
					'No wallet account is selected to sign the personal message with.',
				);
			}

			const signPersonalMessageFeature = currentWallet.features['mys:signPersonalMessage'];
			if (signPersonalMessageFeature) {
				return await signPersonalMessageFeature.signPersonalMessage({
					...signPersonalMessageArgs,
					account: signerAccount,
					chain: signPersonalMessageArgs.chain ?? `mys:${network}`,
				});
			}

			// TODO: Remove this once we officially discontinue mys:signMessage in the wallet standard
			const signMessageFeature = currentWallet.features['mys:signMessage'];
			if (signMessageFeature) {
				console.warn(
					"This wallet doesn't support the `signPersonalMessage` feature... falling back to `signMessage`.",
				);

				const { messageBytes, signature } = await signMessageFeature.signMessage({
					...signPersonalMessageArgs,
					account: signerAccount,
				});
				return { bytes: messageBytes, signature };
			}

			throw new WalletFeatureNotSupportedError(
				"This wallet doesn't support the `signPersonalMessage` feature.",
			);
		},
		...mutationOptions,
	});
}
