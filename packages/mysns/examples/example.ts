// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { getFullnodeUrl, MysClient } from '@mysocial/mys/client';
import { Transaction } from '@mysocial/mys/transactions';

import { MysnsClient } from '../src/mysns-client.js';
import { MysnsTransaction } from '../src/mysns-transaction.js';

// Initialize and execute the MysnsClient to fetch the renewal price list
(async () => {
	const network = 'testnet';
	// Step 1: Create a MysClient instance
	const mysClient = new MysClient({
		url: getFullnodeUrl(network), // Mys testnet endpoint
	});

	// Step 2: Create a MysnsClient instance using TESTNET_CONFIG
	const mysnsClient = new MysnsClient({
		client: mysClient,
		network,
	});

	/* Following can be used to fetch the coin type discount, registration price, and renewal price */
	console.log(await mysnsClient.getPriceList());
	console.log(await mysnsClient.getRenewalPriceList());
	console.log(await mysnsClient.getCoinTypeDiscount());

	/* Following can be used to fetch the domain record */
	console.log('Domain Record: ', await mysnsClient.getNameRecord('myname.mys'));

	/* If discount NFT is used */
	// const discountNft = '0xMyDiscountNft'; // This can be a string or a kioskTransactionArgument
	// const discountNftType = await mysnsClient.getObjectType(discountNft);

	/* Registration Example Using MYS */
	const tx = new Transaction();
	const mysnsTx = new MysnsTransaction(mysnsClient, tx);
	const maxPaymentAmount = 5 * 1_000_000; // In MIST of the payment coin type
	const [coin] = mysnsTx.transaction.splitCoins('0xMyCoin', [maxPaymentAmount]);

	/* Registration Example Using NS */
	const coinConfig = mysnsClient.config.coins.NS; // Specify the coin type used for the transaction
	const priceInfoObjectId = (await mysnsClient.getPriceInfoObject(tx, coinConfig.feed))[0];
	const nft = mysnsTx.register({
		domain: 'myname.mys',
		years: 2,
		coinConfig,
		couponCode: 'fiveplus15percentoff',
		priceInfoObjectId,
		coin,
	});

	/* Registration Example Using USDC */
	// const coinConfig = mysnsClient.config.coins.USDC; // Specify the coin type used for the transaction
	// const nft = mysnsTx.register({
	// 	domain: 'myname.mys',
	// 	years: 2,
	// 	coinConfig,
	// 	coin,
	// });

	// /* Renew Example */
	// const coinConfig = mysnsClient.config.coins.MYS; // Specify the coin type used for the transaction
	// const priceInfoObjectId = await mysnsClient.getPriceInfoObject(tx, coinConfig.feed)[0];
	// mysnsTx.renew({
	// 	nft: '0xMyNft',
	// 	years: 2,
	// 	coinConfig,
	// 	coin,
	// 	priceInfoObjectId,
	// });

	/* Optionally set target address */
	mysnsTx.setTargetAddress({ nft, address: '0xMyAddress' });

	/* Optionally set default */
	mysnsTx.setDefault('myname.mys');

	/* Optionally set user data */
	mysnsTx.setUserData({
		nft,
		value: 'hello',
		key: 'walrus_site_id',
	});

	/* Optionally transfer the NFT */
	mysnsTx.transaction.transferObjects([nft], '0xMyAddress');

	/* Optionally transfer coin */
	mysnsTx.transaction.transferObjects([coin], '0xMyAddress');

	/* Subname Example */
	// const subnameNft = mysnsTx.createSubName({
	// 	parentNft: '0xMyParentNft',
	// 	name: 'name.myname.mys',
	// 	expirationTimestampMs: 1862491339394,
	// 	allowChildCreation: true,
	// 	allowTimeExtension: true,
	// });
	// mysnsTx.transaction.transferObjects([subnameNft], 'YOUR_ADDRESS');

	/* Extend Subname Expiration */
	// mysnsTx.extendExpiration({
	// 	nft: '0xMySubnameNft',
	// 	expirationTimestampMs: 1862511339394,
	// });
})();
