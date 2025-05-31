// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { Ed25519Keypair } from '@mysocial/mys/keypairs/ed25519';
import type { WalletAccount } from '@mysocial/wallet-standard';
import { ReadonlyWalletAccount } from '@mysocial/wallet-standard';

export function createMockAccount(accountOverrides: Partial<WalletAccount> = {}) {
	const keypair = new Ed25519Keypair();
	return new ReadonlyWalletAccount({
		address: keypair.getPublicKey().toMysAddress(),
		publicKey: keypair.getPublicKey().toMysBytes(),
		chains: ['mys:unknown'],
		features: [
			'mys:signAndExecuteTransactionBlock',
			'mys:signTransactionBlock',
			'mys:signAndExecuteTransaction',
			'mys:signTransaction',
		],
		...accountOverrides,
	});
}
