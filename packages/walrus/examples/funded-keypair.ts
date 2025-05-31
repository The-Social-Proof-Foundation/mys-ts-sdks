// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { getFullnodeUrl, SuiClient } from '@mysocial/sui/client';
import { getFaucetHost, requestSuiFromFaucetV2 } from '@mysocial/sui/faucet';
import { Ed25519Keypair } from '@mysocial/sui/keypairs/ed25519';
import { coinWithBalance, Transaction } from '@mysocial/sui/transactions';
import { MIST_PER_SUI, parseStructTag } from '@mysocial/sui/utils';

import { TESTNET_WALRUS_PACKAGE_CONFIG } from '../src/index.js';

export async function getFundedKeypair() {
	const suiClient = new SuiClient({
		url: getFullnodeUrl('testnet'),
	});

	const keypair = Ed25519Keypair.fromSecretKey(
		'suiprivkey1qzmcxscyglnl9hnq82crqsuns0q33frkseks5jw0fye3tuh83l7e6ajfhxx',
	);
	console.log(keypair.toSuiAddress());

	const balance = await suiClient.getBalance({
		owner: keypair.toSuiAddress(),
	});

	if (BigInt(balance.totalBalance) < MIST_PER_SUI) {
		await requestSuiFromFaucetV2({
			host: getFaucetHost('testnet'),
			recipient: keypair.toSuiAddress(),
		});
	}

	const walBalance = await suiClient.getBalance({
		owner: keypair.toSuiAddress(),
		coinType: `0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL`,
	});
	console.log('wal balance:', walBalance.totalBalance);

	if (Number(walBalance.totalBalance) < Number(MIST_PER_SUI) / 2) {
		const tx = new Transaction();

		const exchange = await suiClient.getObject({
			id: TESTNET_WALRUS_PACKAGE_CONFIG.exchangeIds[0],
			options: {
				showType: true,
			},
		});

		const exchangePackageId = parseStructTag(exchange.data?.type!).address;

		const wal = tx.moveCall({
			package: exchangePackageId,
			module: 'wal_exchange',
			function: 'exchange_all_for_wal',
			arguments: [
				tx.object(TESTNET_WALRUS_PACKAGE_CONFIG.exchangeIds[0]),
				coinWithBalance({
					balance: MIST_PER_SUI / 2n,
				}),
			],
		});

		tx.transferObjects([wal], keypair.toSuiAddress());

		const { digest } = await suiClient.signAndExecuteTransaction({
			transaction: tx,
			signer: keypair,
		});

		const { effects } = await suiClient.waitForTransaction({
			digest,
			options: {
				showEffects: true,
			},
		});

		console.log(effects);
	}

	return keypair;
}
