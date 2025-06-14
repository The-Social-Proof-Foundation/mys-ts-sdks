// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, it } from 'vitest';

import { setup, TestToolbox } from './utils/setup';

describe('CoinRead API', () => {
	let toolbox: TestToolbox;
	let publishToolbox: TestToolbox;
	let packageId: string;
	let testType: string;

	beforeAll(async () => {
		[toolbox, publishToolbox] = await Promise.all([setup(), setup()]);
		packageId = await publishToolbox.getPackage('coin_metadata');
		testType = packageId + '::test::TEST';
	});

	it('Get coins with/without type', async () => {
		const mysCoins = await toolbox.client.getCoins({
			owner: toolbox.address(),
		});
		expect(mysCoins.data.length).toEqual(5);

		const testCoins = await toolbox.client.getCoins({
			owner: publishToolbox.address(),
			coinType: testType,
		});
		expect(testCoins.data.length).toEqual(2);

		const allCoins = await toolbox.client.getAllCoins({
			owner: toolbox.address(),
		});
		expect(allCoins.data.length).toEqual(5);
		expect(allCoins.hasNextPage).toEqual(false);

		const publisherAllCoins = await toolbox.client.getAllCoins({
			owner: publishToolbox.address(),
		});
		expect(publisherAllCoins.data.length).toEqual(3);
		expect(publisherAllCoins.hasNextPage).toEqual(false);

		//test paging with limit
		const someMysCoins = await toolbox.client.getCoins({
			owner: toolbox.address(),
			limit: 3,
		});
		expect(someMysCoins.data.length).toEqual(3);
		expect(someMysCoins.nextCursor).toBeTruthy();
	});

	it('Get balance with/without type', async () => {
		const mysBalance = await toolbox.client.getBalance({
			owner: toolbox.address(),
		});
		expect(mysBalance.coinType).toEqual('0x2::mys::MYS');
		expect(mysBalance.coinObjectCount).toEqual(5);
		expect(Number(mysBalance.totalBalance)).toBeGreaterThan(0);

		const testBalance = await toolbox.client.getBalance({
			owner: publishToolbox.address(),
			coinType: testType,
		});
		expect(testBalance.coinType).toEqual(testType);
		expect(testBalance.coinObjectCount).toEqual(2);
		expect(Number(testBalance.totalBalance)).toEqual(11);

		const allBalances = await toolbox.client.getAllBalances({
			owner: publishToolbox.address(),
		});
		expect(allBalances.length).toEqual(2);
	});

	it('Get total supply', async () => {
		const testSupply = await toolbox.client.getTotalSupply({
			coinType: testType,
		});
		expect(Number(testSupply.value)).toEqual(11);
	});
});
