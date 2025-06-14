// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, it } from 'vitest';

import { Transaction } from '../../src/transactions';
import { normalizeMysAddress, MYS_TYPE_ARG } from '../../src/utils';
import { setup, TestToolbox } from './utils/setup';

describe('Object Reading API', () => {
	let toolbox: TestToolbox;

	beforeAll(async () => {
		toolbox = await setup();
	});

	it('Get Owned Objects', async () => {
		const gasObjects = await toolbox.client.getOwnedObjects({
			owner: toolbox.address(),
		});
		expect(gasObjects.data.length).to.greaterThan(0);
	});

	it('Get Object', async () => {
		const gasObjects = await toolbox.getGasObjectsOwnedByAddress();
		expect(gasObjects.data.length).to.greaterThan(0);
		const objectInfos = await Promise.all(
			gasObjects.data.map((gasObject) => {
				return toolbox.client.getObject({
					id: gasObject.coinObjectId,
					options: { showType: true },
				});
			}),
		);
		objectInfos.forEach((objectInfo) => {
			expect(objectInfo.data?.type).to.equal('0x2::coin::Coin<0x2::mys::MYS>');
		});
	});

	it('Get Objects', async () => {
		const gasObjects = await toolbox.getGasObjectsOwnedByAddress();
		expect(gasObjects.data.length).to.greaterThan(0);
		const gasObjectIds = gasObjects.data.map((gasObject) => {
			return gasObject.coinObjectId;
		});
		const objectInfos = await toolbox.client.multiGetObjects({
			ids: gasObjectIds,
			options: {
				showType: true,
			},
		});

		expect(gasObjects.data.length).to.equal(objectInfos.length);

		objectInfos.forEach((objectInfo) => {
			expect(objectInfo.data?.type).to.equal('0x2::coin::Coin<0x2::mys::MYS>');
		});
	});

	it('handles trying to get non-existent old objects', async () => {
		const res = await toolbox.client.tryGetPastObject({
			id: normalizeMysAddress('0x9999'),
			version: 0,
		});

		expect(res.status).toBe('ObjectNotExists');
	});

	it('can read live versions', async () => {
		const { data } = await toolbox.client.getCoins({
			owner: toolbox.address(),
			coinType: MYS_TYPE_ARG,
		});

		const res = await toolbox.client.tryGetPastObject({
			id: data[0].coinObjectId,
			version: Number(data[0].version),
		});

		expect(res.status).toBe('VersionFound');
	});

	it('handles trying to get a newer version than the latest version', async () => {
		const { data } = await toolbox.client.getCoins({
			owner: toolbox.address(),
			coinType: MYS_TYPE_ARG,
		});

		const res = await toolbox.client.tryGetPastObject({
			id: data[0].coinObjectId,
			version: Number(data[0].version) + 1,
		});

		expect(res.status).toBe('VersionTooHigh');
	});

	it('handles fetching versions that do not exist', async () => {
		const { data } = await toolbox.client.getCoins({
			owner: toolbox.address(),
			coinType: MYS_TYPE_ARG,
		});

		const res = await toolbox.client.tryGetPastObject({
			id: data[0].coinObjectId,
			// NOTE: This works because we know that this is a fresh coin that hasn't been modified:
			version: Number(data[0].version) - 1,
		});

		expect(res.status).toBe('VersionNotFound');
	});

	it('can find old versions of objects', async () => {
		const { data } = await toolbox.client.getCoins({
			owner: toolbox.address(),
			coinType: MYS_TYPE_ARG,
		});

		const tx = new Transaction();
		// Transfer the entire gas object:
		tx.transferObjects([tx.gas], normalizeMysAddress('0x2'));

		const { digest } = await toolbox.client.signAndExecuteTransaction({
			signer: toolbox.keypair,
			transaction: tx,
		});
		await toolbox.client.waitForTransaction({ digest });

		const res = await toolbox.client.tryGetPastObject({
			id: data[0].coinObjectId,
			// NOTE: This works because we know that this is a fresh coin that hasn't been modified:
			version: Number(data[0].version),
		});

		expect(res.status).toBe('VersionFound');
	});
});
