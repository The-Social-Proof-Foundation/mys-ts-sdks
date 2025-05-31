// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type {
	MysSignAndExecuteTransactionInput,
	MysSignTransactionInput,
} from '@mysocial/wallet-standard';
import type { Transaction } from '@mysocial/mys/transactions';

type SignTransactionArgs = {
	transaction: Transaction | string;
} & Omit<MysSignTransactionInput, 'account' | 'chain' | 'transaction'>;

type signAndExecuteTransactionArgs = {
	transaction: Transaction | string;
} & Omit<MysSignAndExecuteTransactionInput, 'account' | 'chain' | 'transaction'>;

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
