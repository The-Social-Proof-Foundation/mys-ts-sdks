// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { bcs } from '../../src/bcs';
import { MysClient, MysObjectChangeCreated, MysTransactionBlockResponse } from '../../src/client';
import type { Keypair } from '../../src/cryptography';
import { Transaction } from '../../src/transactions';
import { normalizeMysObjectId, MYS_SYSTEM_STATE_OBJECT_ID } from '../../src/utils';
import {
	DEFAULT_GAS_BUDGET,
	DEFAULT_RECIPIENT,
	publishPackage,
	setup,
	TestToolbox,
	upgradePackage,
} from './utils/setup';

export const MYS_CLOCK_OBJECT_ID = normalizeMysObjectId('0x6');

describe('Transaction Builders', () => {
	let toolbox: TestToolbox;
	let packageId: string;
	let publishTxn: MysTransactionBlockResponse;
	let sharedObjectId: string;

	beforeAll(async () => {
		({ packageId, publishTxn } = await publishPackage('serializer'));
		const sharedObject = publishTxn.effects?.created!.filter(
			(o) =>
				typeof o.owner === 'object' &&
				'Shared' in o.owner &&
				o.owner.Shared.initial_shared_version !== undefined,
		)[0];
		sharedObjectId = sharedObject!.reference.objectId;
	});

	beforeEach(async () => {
		toolbox = await setup();
	});

	it('SplitCoins + TransferObjects', async () => {
		const coins = await toolbox.getGasObjectsOwnedByAddress();
		const tx = new Transaction();
		const coin_0 = coins.data[0];

		const coin = tx.splitCoins(tx.object(coin_0.coinObjectId), [
			bcs.u64().serialize(DEFAULT_GAS_BUDGET * 2),
		]);
		tx.transferObjects([coin], toolbox.address());
		await validateTransaction(toolbox.client, toolbox.keypair, tx);
	});

	it('MergeCoins', async () => {
		const coins = await toolbox.getGasObjectsOwnedByAddress();
		const [coin_0, coin_1] = coins.data;
		const tx = new Transaction();
		tx.mergeCoins(coin_0.coinObjectId, [coin_1.coinObjectId]);
		await validateTransaction(toolbox.client, toolbox.keypair, tx);
	});

	it('MoveCall', async () => {
		const coins = await toolbox.getGasObjectsOwnedByAddress();
		const [coin_0] = coins.data;
		const tx = new Transaction();
		tx.moveCall({
			target: '0x2::pay::split',
			typeArguments: ['0x2::mys::MYS'],
			arguments: [tx.object(coin_0.coinObjectId), tx.pure.u64(DEFAULT_GAS_BUDGET * 2)],
		});
		await validateTransaction(toolbox.client, toolbox.keypair, tx);
	});

	it(
		'MoveCall Shared Object',
		async () => {
			const coins = await toolbox.getGasObjectsOwnedByAddress();
			const coin_2 = coins.data[2];

			const [{ mysAddress: validatorAddress }] = await toolbox.getActiveValidators();

			const tx = new Transaction();
			tx.moveCall({
				target: '0x3::mys_system::request_add_stake',
				arguments: [
					tx.object(MYS_SYSTEM_STATE_OBJECT_ID),
					tx.object(coin_2.coinObjectId),
					tx.pure.address(validatorAddress),
				],
			});

			await validateTransaction(toolbox.client, toolbox.keypair, tx);
		},
		{
			// TODO: This test is currently flaky, so adding a retry to unblock merging
			retry: 10,
		},
	);

	it('SplitCoins from gas object + TransferObjects', async () => {
		const tx = new Transaction();
		const coin = tx.splitCoins(tx.gas, [1]);
		tx.transferObjects([coin], DEFAULT_RECIPIENT);
		await validateTransaction(toolbox.client, toolbox.keypair, tx);
	});

	it('TransferObjects gas object', async () => {
		const tx = new Transaction();
		tx.transferObjects([tx.gas], DEFAULT_RECIPIENT);
		await validateTransaction(toolbox.client, toolbox.keypair, tx);
	});

	it('TransferObject', async () => {
		const coins = await toolbox.getGasObjectsOwnedByAddress();
		const tx = new Transaction();
		const coin_0 = coins.data[2];

		tx.transferObjects([coin_0.coinObjectId], DEFAULT_RECIPIENT);
		await validateTransaction(toolbox.client, toolbox.keypair, tx);
	});

	it('Move Shared Object Call with mixed usage of mutable and immutable references', async () => {
		const tx = new Transaction();
		tx.moveCall({
			target: `${packageId}::serializer_tests::value`,
			arguments: [tx.object(sharedObjectId)],
		});
		tx.moveCall({
			target: `${packageId}::serializer_tests::set_value`,
			arguments: [tx.object(sharedObjectId)],
		});
		await validateTransaction(toolbox.client, toolbox.keypair, tx);
	});

	it('Move Shared Object Call by Value', async () => {
		const tx = new Transaction();
		tx.moveCall({
			target: `${packageId}::serializer_tests::value`,
			arguments: [tx.object(sharedObjectId)],
		});
		tx.moveCall({
			target: `${packageId}::serializer_tests::delete_value`,
			arguments: [tx.object(sharedObjectId)],
		});
		await validateTransaction(toolbox.client, toolbox.keypair, tx);
	});

	it('immutable clock', async () => {
		const tx = new Transaction();
		tx.moveCall({
			target: `${packageId}::serializer_tests::use_clock`,
			arguments: [tx.object(MYS_CLOCK_OBJECT_ID)],
		});
		await validateTransaction(toolbox.client, toolbox.keypair, tx);
	});

	it(
		'Publish and Upgrade Package',
		async () => {
			// Step 1. Publish the package
			const { packageId, publishTxn } = await publishPackage('serializer', toolbox);

			const capId = (
				publishTxn.objectChanges?.find(
					(a) =>
						a.type === 'created' &&
						a.objectType.endsWith('UpgradeCap') &&
						'Immutable' !== a.owner &&
						'AddressOwner' in a.owner &&
						a.owner.AddressOwner === toolbox.address(),
				) as MysObjectChangeCreated
			)?.objectId;

			expect(capId).toBeTruthy();

			const sharedObjectId = publishTxn.effects?.created!.filter(
				(o) =>
					typeof o.owner === 'object' &&
					'Shared' in o.owner &&
					o.owner.Shared.initial_shared_version !== undefined,
			)[0].reference.objectId!;

			// Step 2. Confirm that its functions work as expected in its
			// first version
			const callOrigTx = new Transaction();
			callOrigTx.moveCall({
				target: `${packageId}::serializer_tests::value`,
				arguments: [callOrigTx.object(sharedObjectId)],
			});
			callOrigTx.moveCall({
				target: `${packageId}::serializer_tests::set_value`,
				arguments: [callOrigTx.object(sharedObjectId)],
			});
			await validateTransaction(toolbox.client, toolbox.keypair, callOrigTx);

			// Step 4. Make sure the behaviour of the upgrade package matches
			// the newly introduced function
			await upgradePackage(packageId, capId, 'serializer_upgrade', toolbox);
		},
		{
			// TODO: This test is currently flaky, so adding a retry to unblock merging
			retry: 10,
		},
	);

	it('builds object options', async () => {
		const tx = new Transaction();

		tx.moveCall({
			target: `${packageId}::serializer_tests::none`,
			typeArguments: ['0x2::coin::Coin<0x2::mys::MYS>'],
			arguments: [
				tx.object.option({
					type: '0x2::coin::Coin<0x2::mys::MYS>',
					value: null,
				}),
			],
		});
		const coin = tx.splitCoins(tx.gas, [1]);
		const coin2 = tx.moveCall({
			target: `${packageId}::serializer_tests::some`,
			typeArguments: ['0x2::coin::Coin<0x2::mys::MYS>'],
			arguments: [
				tx.object.option({
					type: '0x2::coin::Coin<0x2::mys::MYS>',
					value: coin,
				}),
			],
		});

		const coin3 = tx.moveCall({
			target: `${packageId}::serializer_tests::some`,
			typeArguments: ['0x2::coin::Coin<0x2::mys::MYS>'],
			arguments: [
				tx.object.option({
					type: '0x2::coin::Coin<0x2::mys::MYS>',
					value: coin2,
				}),
			],
		});

		tx.transferObjects([coin3], toolbox.keypair.toMysAddress());

		await validateTransaction(toolbox.client, toolbox.keypair, tx);
	});
});

async function validateTransaction(client: MysClient, signer: Keypair, tx: Transaction) {
	tx.setSenderIfNotSet(signer.getPublicKey().toMysAddress());
	const localDigest = await tx.getDigest({ client });
	const result = await client.signAndExecuteTransaction({
		signer,
		transaction: tx,
		options: {
			showEffects: true,
		},
	});
	await client.waitForTransaction({ digest: result.digest });
	expect(localDigest).toEqual(result.digest);
	expect(result.effects?.status.status).toEqual('success');
}
