// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, it } from 'vitest';

import { setup, TestToolbox } from './utils/setup';

describe('Test Coin Metadata', () => {
	let toolbox: TestToolbox;
	let packageId: string;

	beforeAll(async () => {
		toolbox = await setup();
		packageId = await toolbox.getPackage('coin_metadata');
	});

	it('Test accessing coin metadata', async () => {
		const coinMetadata = (await toolbox.client.getCoinMetadata({
			coinType: `${packageId}::test::TEST`,
		}))!;
		expect(coinMetadata.decimals).to.equal(2);
		expect(coinMetadata.name).to.equal('Test Coin');
		expect(coinMetadata.description).to.equal('Test coin metadata');
		expect(coinMetadata.iconUrl).to.equal('http://mysocial.network');
	});
});
