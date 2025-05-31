// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { getFullnodeUrl, MysClient } from '@mysocial/mys/client';
import { getFaucetHost, requestMysFromFaucetV2 } from '@mysocial/mys/faucet';
import { Ed25519Keypair } from '@mysocial/mys/keypairs/ed25519';
import { coinWithBalance, Transaction } from '@mysocial/mys/transactions';
import { MIST_PER_MYS, parseStructTag } from '@mysocial/mys/utils';

import { TESTNET_WALRUS_PACKAGE_CONFIG } from '../src/index.js';

export async function getFundedKeypair() {
	const mysClient = new MysClient({
		url: getFullnodeUrl('testnet'),
	});

	const keypair = Ed25519Keypair.fromSecretKey(
		'mysprivkey1qzmcxscyglnl9hnq82crqsuns0q33frkseks5jw0fye3tuh83l7e6ajfhxx',
	);
	console.log(keypair.toMysAddress());

	const balance = await mysClient.getBalance({
		owner: keypair.toMysAddress(),
	});

	if (BigInt(balance.totalBalance) < MIST_PER_MYS) {
		await requestMysFromFaucetV2({
			host: getFaucetHost('testnet'),
			recipient: keypair.toMysAddress(),
		});
	}

	const walBalance = await mysClient.getBalance({
		owner: keypair.toMysAddress(),
		coinType: `0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL`,
	});
	console.log('wal balance:', walBalance.totalBalance);

	if (Number(walBalance.totalBalance) < Number(MIST_PER_MYS) / 2) {
		const tx = new Transaction();

		const exchange = await mysClient.getObject({
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
					balance: MIST_PER_MYS / 2n,
				}),
			],
		});

		tx.transferObjects([wal], keypair.toMysAddress());

		const { digest } = await mysClient.signAndExecuteTransaction({
			transaction: tx,
			signer: keypair,
		});

		const { effects } = await mysClient.waitForTransaction({
			digest,
			options: {
				showEffects: true,
			},
		});

		console.log(effects);
	}

	return keypair;
}
