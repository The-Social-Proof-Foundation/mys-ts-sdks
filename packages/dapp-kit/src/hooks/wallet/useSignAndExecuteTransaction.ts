// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { Transaction } from '@socialproof/mys/transactions';
import { toBase64 } from '@socialproof/mys/utils';
import type {
	MysSignAndExecuteTransactionInput,
	MysSignAndExecuteTransactionOutput,
} from '@socialproof/wallet-standard';
import { signTransaction } from '@socialproof/wallet-standard';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';

import { walletMutationKeys } from '../../constants/walletMutationKeys.js';
import {
	WalletFeatureNotSupportedError,
	WalletNoAccountSelectedError,
	WalletNotConnectedError,
} from '../../errors/walletErrors.js';
import type { PartialBy } from '../../types/utilityTypes.js';
import { useMysClientContext } from '../useMysClient.js';
import { useCurrentAccount } from './useCurrentAccount.js';
import { useCurrentWallet } from './useCurrentWallet.js';
import { useReportTransactionEffects } from './useReportTransactionEffects.js';

type UseSignAndExecuteTransactionArgs = PartialBy<
	Omit<MysSignAndExecuteTransactionInput, 'transaction'>,
	'account' | 'chain'
> & {
	transaction: Transaction | string;
};

type UseSignAndExecuteTransactionResult = MysSignAndExecuteTransactionOutput;

type UseSignAndExecuteTransactionError =
	| WalletFeatureNotSupportedError
	| WalletNoAccountSelectedError
	| WalletNotConnectedError
	| Error;

type ExecuteTransactionResult =
	| {
			digest: string;
			rawEffects?: number[];
	  }
	| {
			effects?: {
				bcs?: string;
			};
	  };

type UseSignAndExecuteTransactionMutationOptions<Result extends ExecuteTransactionResult> = Omit<
	UseMutationOptions<
		Result,
		UseSignAndExecuteTransactionError,
		UseSignAndExecuteTransactionArgs,
		unknown
	>,
	'mutationFn'
> & {
	execute?: ({ bytes, signature }: { bytes: string; signature: string }) => Promise<Result>;
};

/**
 * Mutation hook for prompting the user to sign and execute a transaction.
 */
export function useSignAndExecuteTransaction<
	Result extends ExecuteTransactionResult = UseSignAndExecuteTransactionResult,
>({
	mutationKey,
	execute,
	...mutationOptions
}: UseSignAndExecuteTransactionMutationOptions<Result> = {}): UseMutationResult<
	Result,
	UseSignAndExecuteTransactionError,
	UseSignAndExecuteTransactionArgs
> {
	const { currentWallet, supportedIntents } = useCurrentWallet();
	const currentAccount = useCurrentAccount();
	const { client, network } = useMysClientContext();
	const { mutate: reportTransactionEffects } = useReportTransactionEffects();

	const executeTransaction: ({
		bytes,
		signature,
	}: {
		bytes: string;
		signature: string;
	}) => Promise<ExecuteTransactionResult> =
		execute ??
		(async ({ bytes, signature }) => {
			const { digest, rawEffects } = await client.executeTransactionBlock({
				transactionBlock: bytes,
				signature,
				options: {
					showRawEffects: true,
				},
			});

			return {
				digest,
				rawEffects,
				effects: toBase64(new Uint8Array(rawEffects!)),
				bytes,
				signature,
			};
		});

	return useMutation({
		mutationKey: walletMutationKeys.signAndExecuteTransaction(mutationKey),
		mutationFn: async ({ transaction, ...signTransactionArgs }): Promise<Result> => {
			if (!currentWallet) {
				throw new WalletNotConnectedError('No wallet is connected.');
			}

			const signerAccount = signTransactionArgs.account ?? currentAccount;
			if (!signerAccount) {
				throw new WalletNoAccountSelectedError(
					'No wallet account is selected to sign the transaction with.',
				);
			}

			if (
				!currentWallet.features['mys:signTransaction'] &&
				!currentWallet.features['mys:signTransactionBlock']
			) {
				throw new WalletFeatureNotSupportedError(
					"This wallet doesn't support the `signTransaction` feature.",
				);
			}

			const chain = signTransactionArgs.chain ?? `mys:${network}`;
			const { signature, bytes } = await signTransaction(currentWallet, {
				...signTransactionArgs,
				transaction: {
					async toJSON() {
						return typeof transaction === 'string'
							? transaction
							: await transaction.toJSON({
									supportedIntents,
									client,
								});
					},
				},
				account: signerAccount,
				chain,
			});

			const result = await executeTransaction({ bytes, signature });

			let effects: string;

			if ('effects' in result && result.effects?.bcs) {
				effects = result.effects.bcs;
			} else if ('rawEffects' in result) {
				effects = toBase64(new Uint8Array(result.rawEffects!));
			} else {
				throw new Error('Could not parse effects from transaction result.');
			}

			reportTransactionEffects({ effects, account: signerAccount, chain });

			return result as Result;
		},
		...mutationOptions,
	});
}
