// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { toBase58 } from '@socialproof/bcs';
import { expect, it } from 'vitest';

import { bcs } from '../../bcs/index.js';
import { normalizeStructTag, normalizeMysAddress } from '../../utils/mys-types.js';

// Oooh-weeee we nailed it!
it('can serialize simplified programmable call struct', () => {
	const moveCall = {
		package: '0x2',
		module: 'display',
		function: 'new',
		typeArguments: [normalizeStructTag('0x6::capy::Capy')],
		arguments: [
			{
				$kind: 'GasCoin',
				GasCoin: true,
			},
			{
				$kind: 'NestedResult',
				NestedResult: [0, 1],
			},
			{
				$kind: 'Input',
				Input: 3,
			},
			{
				$kind: 'Result',
				Result: 1,
			},
		],
	} satisfies typeof bcs.ProgrammableMoveCall.$inferType;

	const bytes = bcs.ProgrammableMoveCall.serialize(moveCall).toBytes();
	const result = bcs.ProgrammableMoveCall.parse(bytes);

	// since we normalize addresses when (de)serializing, the returned value differs
	// only check the module and the function; ignore address comparison (it's not an issue
	// with non-0x2 addresses).
	expect(result.arguments).toEqual(moveCall.arguments);
	expect(result.function).toEqual(moveCall.function);
	expect(result.module).toEqual(moveCall.module);
	expect(normalizeMysAddress(result.package)).toEqual(normalizeMysAddress(moveCall.package));
	expect(result.typeArguments[0]).toEqual(moveCall.typeArguments[0]);
});

function ref(): { objectId: string; version: string; digest: string } {
	return {
		objectId: normalizeMysAddress((Math.random() * 100000).toFixed(0).padEnd(64, '0')),
		version: String((Math.random() * 10000).toFixed(0)),
		digest: toBase58(
			new Uint8Array([
				0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1,
				2,
			]),
		),
	};
}

it('can serialize transaction data with a programmable transaction', () => {
	const mys = normalizeMysAddress('0x2');
	const txData = {
		$kind: 'V1',
		V1: {
			sender: normalizeMysAddress('0xBAD'),
			expiration: { $kind: 'None', None: true },
			gasData: {
				payment: [ref()],
				owner: mys,
				price: '1',
				budget: '1000000',
			},
			kind: {
				$kind: 'ProgrammableTransaction',
				ProgrammableTransaction: {
					inputs: [
						// first argument is the publisher object
						{
							$kind: 'Object',
							Object: {
								$kind: 'ImmOrOwnedObject',
								ImmOrOwnedObject: ref(),
							},
						},
						// second argument is a vector of names
						{
							$kind: 'Pure',
							Pure: {
								bytes: bcs
									.vector(bcs.String)
									.serialize(['name', 'description', 'img_url'])
									.toBase64(),
							},
						},
						// third argument is a vector of values
						{
							$kind: 'Pure',
							Pure: {
								bytes: bcs
									.vector(bcs.String)
									.serialize([
										'Capy {name}',
										'A cute little creature',
										'https://api.capy.art/{id}/svg',
									])
									.toBase64(),
							},
						},
						// 4th and last argument is the account address to send display to
						{
							$kind: 'Pure',
							Pure: {
								bytes: bcs.Address.serialize(ref().objectId).toBase64(),
							},
						},
					],
					commands: [
						{
							$kind: 'MoveCall',
							MoveCall: {
								package: mys,
								module: 'display',
								function: 'new',
								typeArguments: [`${mys}::capy::Capy`],
								arguments: [
									// publisher object
									{
										$kind: 'Input',
										Input: 0,
									},
								],
							},
						},
						{
							$kind: 'MoveCall',
							MoveCall: {
								package: mys,
								module: 'display',
								function: 'add_multiple',
								typeArguments: [`${mys}::capy::Capy`],
								arguments: [
									// result of the first transaction
									{
										$kind: 'Result',
										Result: 0,
									},
									// second argument - vector of names
									{
										$kind: 'Input',
										Input: 1,
									},
									// third argument - vector of values
									{
										$kind: 'Input',
										Input: 2,
									},
								],
							},
						},
						{
							$kind: 'MoveCall',
							MoveCall: {
								package: mys,
								module: 'display',
								function: 'update_version',
								typeArguments: [`${mys}::capy::Capy`],
								arguments: [
									// result of the first transaction again
									{
										$kind: 'Result',
										Result: 0,
									},
								],
							},
						},
						{
							$kind: 'TransferObjects',
							TransferObjects: {
								objects: [
									// the display object
									{
										$kind: 'Result',
										Result: 0,
									},
								],
								// address is also an input
								address: {
									$kind: 'Input',
									Input: 3,
								},
							},
						},
					],
				},
			},
		},
	} satisfies typeof bcs.TransactionData.$inferType;

	const bytes = bcs.TransactionData.serialize(txData).toBytes();
	const result = bcs.TransactionData.parse(bytes);
	expect(result).toMatchObject(txData);
});
