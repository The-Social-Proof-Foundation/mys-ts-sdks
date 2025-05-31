// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0
import { getFullnodeUrl, MysClient } from '@socialproof/mys/client';
import { Transaction } from '@socialproof/mys/transactions';
import { MIST_PER_MYS, normalizeMysAddress } from '@socialproof/mys/utils';
import { expect } from 'vitest';

import { ALLOWED_METADATA, MysnsClient, MysnsTransaction } from '../src/index.js';

export const e2eLiveNetworkDryRunFlow = async (network: 'mainnet' | 'testnet') => {
	const client = new MysClient({ url: getFullnodeUrl(network) });

	const sender = normalizeMysAddress('0x2');
	const mysnsClient = new MysnsClient({
		client,
		network,
	});

	// Getting price lists accurately
	const priceList = await mysnsClient.getPriceList();
	const renewalPriceList = await mysnsClient.getRenewalPriceList();
	const coinDiscount = await mysnsClient.getCoinTypeDiscount();

	// Expected lists
	const expectedPriceList = new Map([
		[[3, 3], 500000000],
		[[4, 4], 100000000],
		[[5, 63], 10000000],
	]);

	const expectedRenewalPriceList = new Map([
		[[3, 3], 150000000],
		[[4, 4], 50000000],
		[[5, 63], 5000000],
	]);

	const expectedCoinDiscount = new Map([
		[mysnsClient.config.coins.USDC.type.slice(2), 0],
		[mysnsClient.config.coins.MYS.type.slice(2), 0],
		[mysnsClient.config.coins.NS.type.slice(2), 25],
	]);
	expect(priceList).toEqual(expectedPriceList);
	expect(renewalPriceList).toEqual(expectedRenewalPriceList);
	expect(coinDiscount).toEqual(expectedCoinDiscount);

	const tx = new Transaction();
	const coinConfig = mysnsClient.config.coins.MYS; // Specify the coin type used for the transaction
	const priceInfoObjectId =
		coinConfig !== mysnsClient.config.coins.USDC
			? (await mysnsClient.getPriceInfoObject(tx, coinConfig.feed))[0]
			: null;

	const mysnsTx = new MysnsTransaction(mysnsClient, tx);

	const uniqueName =
		(Date.now().toString(36) + Math.random().toString(36).substring(2)).repeat(2) + '.mys';

	const [coinInput] = mysnsTx.transaction.splitCoins(mysnsTx.transaction.gas, [10n * MIST_PER_MYS]);
	// register test.mys for 2 years.
	const nft = mysnsTx.register({
		domain: uniqueName,
		years: 2,
		coinConfig: mysnsClient.config.coins.MYS,
		coin: coinInput,
		priceInfoObjectId,
	});
	// Sets the target address of the NFT.
	mysnsTx.setTargetAddress({
		nft,
		address: sender,
		isSubname: false,
	});

	mysnsTx.setDefault(uniqueName);

	// Sets the avatar of the NFT.
	mysnsTx.setUserData({
		nft,
		key: ALLOWED_METADATA.avatar,
		value: '0x0',
	});

	mysnsTx.setUserData({
		nft,
		key: ALLOWED_METADATA.contentHash,
		value: '0x1',
	});

	mysnsTx.setUserData({
		nft,
		key: ALLOWED_METADATA.walrusSiteId,
		value: '0x2',
	});

	const subNft = mysnsTx.createSubName({
		parentNft: nft,
		name: 'node.' + uniqueName,
		expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30,
		allowChildCreation: true,
		allowTimeExtension: true,
	});

	// create/remove some leaf names as an NFT
	mysnsTx.createLeafSubName({
		parentNft: nft,
		name: 'leaf.' + uniqueName,
		targetAddress: sender,
	});
	mysnsTx.removeLeafSubName({ parentNft: nft, name: 'leaf.' + uniqueName });

	// do it for sub nft too
	mysnsTx.createLeafSubName({
		parentNft: subNft,
		name: 'leaf.node.' + uniqueName,
		targetAddress: sender,
	});
	mysnsTx.removeLeafSubName({ parentNft: subNft, name: 'leaf.node.' + uniqueName });

	// extend expiration a bit further for the subNft
	mysnsTx.extendExpiration({
		nft: subNft,
		expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30 * 2,
	});

	mysnsTx.editSetup({
		parentNft: nft,
		name: 'node.' + uniqueName,
		allowChildCreation: true,
		allowTimeExtension: false,
	});

	// let's go 2 levels deep and edit setups!
	const moreNestedNft = mysnsTx.createSubName({
		parentNft: subNft,
		name: 'more.node.' + uniqueName,
		allowChildCreation: true,
		allowTimeExtension: true,
		expirationTimestampMs: Date.now() + 1000 * 60 * 60 * 24 * 30,
	});

	mysnsTx.editSetup({
		parentNft: subNft,
		name: 'more.node.' + uniqueName,
		allowChildCreation: false,
		allowTimeExtension: false,
	});

	// do it for sub nft too
	tx.transferObjects([moreNestedNft, subNft, nft, coinInput], tx.pure.address(sender));

	tx.setSender(sender);

	if (network === 'mainnet') {
		tx.setGasPayment([
			{
				objectId: '0xc7fcf957faeb0cdd9809b2ab43e0a8bf7a945cfdac13e8cba527261fecefa4dd',
				version: '86466933',
				digest: '2F8iuFVJm55J96FnJ99Th493D254BaJkUccbwz5rHFDc',
			},
		]);
	} else if (network === 'testnet') {
		tx.setGasPayment([
			{
				objectId: '0xeb709b97ca3e87e385d019ccb7da4a9bd99f9405f9b0d692f21c9d2e5714f27a',
				version: '169261602',
				digest: 'HJehhEV1N8rqjjHbwDgjeCZJkHPRavMmihTvyTJme2rA',
			},
		]);
	}

	return client.dryRunTransactionBlock({
		transactionBlock: await tx.build({
			client,
		}),
	});
};
