// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type {
	SuiSignAndExecuteTransactionInput,
	SuiSignTransactionInput,
} from '@mysocial/wallet-standard';
import type { Transaction } from '@mysocial/sui/transactions';

type SignTransactionArgs = {
	transaction: Transaction | string;
} & Omit<SuiSignTransactionInput, 'account' | 'chain' | 'transaction'>;

type signAndExecuteTransactionArgs = {
	transaction: Transaction | string;
} & Omit<SuiSignAndExecuteTransactionInput, 'account' | 'chain' | 'transaction'>;

export function createSignerActions() {
	return {
		async signTransaction(_args: SignTransactionArgs): Promise<{
			bytes: string;
			signature: string;
		}> {
			throw new Error('Not implemented');
		},
		async signAndExecuteTransaction(_args: signAndExecuteTransactionArgs): Promise<{
			bytes: string;
			signature: string;
			digest: string;
			effects: string;
		}> {
			throw new Error('Not implemented');
		},
	};
}
