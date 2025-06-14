// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { toBase58 } from '@socialproof/bcs';
import type { InferInput } from 'valibot';
import { parse } from 'valibot';

import { bcs } from '../bcs/index.js';
import { normalizeMysAddress } from '../utils/mys-types.js';
import type {
	Argument,
	CallArg,
	Command,
	GasData,
	TransactionExpiration,
} from './data/internal.js';
import { TransactionData } from './data/internal.js';
import { transactionDataFromV1 } from './data/v1.js';
import type { SerializedTransactionDataV1 } from './data/v1.js';
import type { SerializedTransactionDataV2 } from './data/v2.js';
import { hashTypedData } from './hash.js';

function prepareMysAddress(address: string) {
	return normalizeMysAddress(address).replace('0x', '');
}

export class TransactionDataBuilder implements TransactionData {
	static fromKindBytes(bytes: Uint8Array) {
		const kind = bcs.TransactionKind.parse(bytes);

		const programmableTx = kind.ProgrammableTransaction;
		if (!programmableTx) {
			throw new Error('Unable to deserialize from bytes.');
		}

		return TransactionDataBuilder.restore({
			version: 2,
			sender: null,
			expiration: null,
			gasData: {
				budget: null,
				owner: null,
				payment: null,
				price: null,
			},
			inputs: programmableTx.inputs,
			commands: programmableTx.commands,
		});
	}

	static fromBytes(bytes: Uint8Array) {
		const rawData = bcs.TransactionData.parse(bytes);
		const data = rawData?.V1;
		const programmableTx = data.kind.ProgrammableTransaction;

		if (!data || !programmableTx) {
			throw new Error('Unable to deserialize from bytes.');
		}

		return TransactionDataBuilder.restore({
			version: 2,
			sender: data.sender,
			expiration: data.expiration,
			gasData: data.gasData,
			inputs: programmableTx.inputs,
			commands: programmableTx.commands,
		});
	}

	static restore(
		data:
			| InferInput<typeof SerializedTransactionDataV2>
			| InferInput<typeof SerializedTransactionDataV1>,
	) {
		if (data.version === 2) {
			return new TransactionDataBuilder(parse(TransactionData, data));
		} else {
			return new TransactionDataBuilder(parse(TransactionData, transactionDataFromV1(data)));
		}
	}

	/**
	 * Generate transaction digest.
	 *
	 * @param bytes BCS serialized transaction data
	 * @returns transaction digest.
	 */
	static getDigestFromBytes(bytes: Uint8Array) {
		const hash = hashTypedData('TransactionData', bytes);
		return toBase58(hash);
	}

	// @deprecated use gasData instead
	get gasConfig() {
		return this.gasData;
	}
	// @deprecated use gasData instead
	set gasConfig(value) {
		this.gasData = value;
	}

	version = 2 as const;
	sender: string | null;
	expiration: TransactionExpiration | null;
	gasData: GasData;
	inputs: CallArg[];
	commands: Command[];

	constructor(clone?: TransactionData) {
		this.sender = clone?.sender ?? null;
		this.expiration = clone?.expiration ?? null;
		this.inputs = clone?.inputs ?? [];
		this.commands = clone?.commands ?? [];
		this.gasData = clone?.gasData ?? {
			budget: null,
			price: null,
			owner: null,
			payment: null,
		};
	}

	build({
		maxSizeBytes = Infinity,
		overrides,
		onlyTransactionKind,
	}: {
		maxSizeBytes?: number;
		overrides?: {
			expiration?: TransactionExpiration;
			sender?: string;
			// @deprecated use gasData instead
			gasConfig?: Partial<GasData>;
			gasData?: Partial<GasData>;
		};
		onlyTransactionKind?: boolean;
	} = {}) {
		// TODO validate that inputs and intents are actually resolved
		const inputs = this.inputs as (typeof bcs.CallArg.$inferInput)[];
		const commands = this.commands as Extract<
			Command<Exclude<Argument, { IntentResult: unknown } | { NestedIntentResult: unknown }>>,
			{ Upgrade: unknown }
		>[];

		const kind = {
			ProgrammableTransaction: {
				inputs,
				commands,
			},
		};

		if (onlyTransactionKind) {
			return bcs.TransactionKind.serialize(kind, { maxSize: maxSizeBytes }).toBytes();
		}

		const expiration = overrides?.expiration ?? this.expiration;
		const sender = overrides?.sender ?? this.sender;
		const gasData = { ...this.gasData, ...overrides?.gasConfig, ...overrides?.gasData };

		if (!sender) {
			throw new Error('Missing transaction sender');
		}

		if (!gasData.budget) {
			throw new Error('Missing gas budget');
		}

		if (!gasData.payment) {
			throw new Error('Missing gas payment');
		}

		if (!gasData.price) {
			throw new Error('Missing gas price');
		}

		const transactionData = {
			sender: prepareMysAddress(sender),
			expiration: expiration ? expiration : { None: true },
			gasData: {
				payment: gasData.payment,
				owner: prepareMysAddress(this.gasData.owner ?? sender),
				price: BigInt(gasData.price),
				budget: BigInt(gasData.budget),
			},
			kind: {
				ProgrammableTransaction: {
					inputs,
					commands,
				},
			},
		};

		return bcs.TransactionData.serialize(
			{ V1: transactionData },
			{ maxSize: maxSizeBytes },
		).toBytes();
	}

	addInput<T extends 'object' | 'pure'>(type: T, arg: CallArg) {
		const index = this.inputs.length;
		this.inputs.push(arg);
		return { Input: index, type, $kind: 'Input' as const };
	}

	getInputUses(index: number, fn: (arg: Argument, command: Command) => void) {
		this.mapArguments((arg, command) => {
			if (arg.$kind === 'Input' && arg.Input === index) {
				fn(arg, command);
			}

			return arg;
		});
	}

	mapCommandArguments(
		index: number,
		fn: (arg: Argument, command: Command, commandIndex: number) => Argument,
	) {
		const command = this.commands[index];

		switch (command.$kind) {
			case 'MoveCall':
				command.MoveCall.arguments = command.MoveCall.arguments.map((arg) =>
					fn(arg, command, index),
				);
				break;
			case 'TransferObjects':
				command.TransferObjects.objects = command.TransferObjects.objects.map((arg) =>
					fn(arg, command, index),
				);
				command.TransferObjects.address = fn(command.TransferObjects.address, command, index);
				break;
			case 'SplitCoins':
				command.SplitCoins.coin = fn(command.SplitCoins.coin, command, index);
				command.SplitCoins.amounts = command.SplitCoins.amounts.map((arg) =>
					fn(arg, command, index),
				);
				break;
			case 'MergeCoins':
				command.MergeCoins.destination = fn(command.MergeCoins.destination, command, index);
				command.MergeCoins.sources = command.MergeCoins.sources.map((arg) =>
					fn(arg, command, index),
				);
				break;
			case 'MakeMoveVec':
				command.MakeMoveVec.elements = command.MakeMoveVec.elements.map((arg) =>
					fn(arg, command, index),
				);
				break;
			case 'Upgrade':
				command.Upgrade.ticket = fn(command.Upgrade.ticket, command, index);
				break;
			case '$Intent':
				const inputs = command.$Intent.inputs;
				command.$Intent.inputs = {};

				for (const [key, value] of Object.entries(inputs)) {
					command.$Intent.inputs[key] = Array.isArray(value)
						? value.map((arg) => fn(arg, command, index))
						: fn(value, command, index);
				}

				break;
			case 'Publish':
				break;
			default:
				throw new Error(`Unexpected transaction kind: ${(command as { $kind: unknown }).$kind}`);
		}
	}

	mapArguments(fn: (arg: Argument, command: Command, commandIndex: number) => Argument) {
		for (const commandIndex of this.commands.keys()) {
			this.mapCommandArguments(commandIndex, fn);
		}
	}

	replaceCommand(index: number, replacement: Command | Command[], resultIndex = index) {
		if (!Array.isArray(replacement)) {
			this.commands[index] = replacement;
			return;
		}

		const sizeDiff = replacement.length - 1;
		this.commands.splice(index, 1, ...replacement);

		if (sizeDiff !== 0) {
			this.mapArguments((arg, _command, commandIndex) => {
				if (commandIndex < index + replacement.length) {
					return arg;
				}

				switch (arg.$kind) {
					case 'Result':
						if (arg.Result === index) {
							arg.Result = resultIndex;
						}

						if (arg.Result > index) {
							arg.Result += sizeDiff;
						}
						break;

					case 'NestedResult':
						if (arg.NestedResult[0] === index) {
							arg.NestedResult[0] = resultIndex;
						}

						if (arg.NestedResult[0] > index) {
							arg.NestedResult[0] += sizeDiff;
						}
						break;
				}
				return arg;
			});
		}
	}

	getDigest() {
		const bytes = this.build({ onlyTransactionKind: false });
		return TransactionDataBuilder.getDigestFromBytes(bytes);
	}

	snapshot(): TransactionData {
		return parse(TransactionData, this);
	}

	shallowClone() {
		return new TransactionDataBuilder({
			version: this.version,
			sender: this.sender,
			expiration: this.expiration,
			gasData: {
				...this.gasData,
			},
			inputs: [...this.inputs],
			commands: [...this.commands],
		});
	}
}
