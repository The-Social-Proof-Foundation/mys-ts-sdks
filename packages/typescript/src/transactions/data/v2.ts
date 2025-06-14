// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { EnumInputShape } from '@socialproof/bcs';
import type { GenericSchema, InferInput, InferOutput } from 'valibot';
import {
	array,
	boolean,
	integer,
	literal,
	nullable,
	nullish,
	number,
	object,
	optional,
	pipe,
	record,
	string,
	tuple,
	union,
	unknown,
} from 'valibot';

import { BCSBytes, JsonU64, ObjectID, ObjectRef, MysAddress } from './internal.js';
import type { Simplify } from '@socialproof/utils';

function enumUnion<T extends Record<string, GenericSchema<any>>>(options: T) {
	return union(
		Object.entries(options).map(([key, value]) => object({ [key]: value })),
	) as GenericSchema<
		EnumInputShape<
			Simplify<{
				[K in keyof T]: InferInput<T[K]>;
			}>
		>
	>;
}

// https://github.com/The-Social-Proof-Foundation/mys-core/blob/df41d5fa8127634ff4285671a01ead00e519f806/crates/mys-types/src/transaction.rs#L690-L702
const Argument = enumUnion({
	GasCoin: literal(true),
	Input: pipe(number(), integer()),
	Result: pipe(number(), integer()),
	NestedResult: tuple([pipe(number(), integer()), pipe(number(), integer())]),
});

// https://github.com/The-Social-Proof-Foundation/mys-core/blob/df41d5fa8127634ff4285671a01ead00e519f806/crates/mys-types/src/transaction.rs#L1387-L1392
const GasData = object({
	budget: nullable(JsonU64),
	price: nullable(JsonU64),
	owner: nullable(MysAddress),
	payment: nullable(array(ObjectRef)),
});

// https://github.com/The-Social-Proof-Foundation/mys-core/blob/df41d5fa8127634ff4285671a01ead00e519f806/crates/mys-types/src/transaction.rs#L707-L718
const ProgrammableMoveCall = object({
	package: ObjectID,
	module: string(),
	function: string(),
	// snake case in rust
	typeArguments: array(string()),
	arguments: array(Argument),
});

const $Intent = object({
	name: string(),
	inputs: record(string(), union([Argument, array(Argument)])),
	data: record(string(), unknown()),
});

// https://github.com/The-Social-Proof-Foundation/mys-core/blob/df41d5fa8127634ff4285671a01ead00e519f806/crates/mys-types/src/transaction.rs#L657-L685
const Command = enumUnion({
	MoveCall: ProgrammableMoveCall,
	TransferObjects: object({
		objects: array(Argument),
		address: Argument,
	}),
	SplitCoins: object({
		coin: Argument,
		amounts: array(Argument),
	}),
	MergeCoins: object({
		destination: Argument,
		sources: array(Argument),
	}),
	Publish: object({
		modules: array(BCSBytes),
		dependencies: array(ObjectID),
	}),
	MakeMoveVec: object({
		type: nullable(string()),
		elements: array(Argument),
	}),
	Upgrade: object({
		modules: array(BCSBytes),
		dependencies: array(ObjectID),
		package: ObjectID,
		ticket: Argument,
	}),
	$Intent,
});

// https://github.com/The-Social-Proof-Foundation/mys-core/blob/df41d5fa8127634ff4285671a01ead00e519f806/crates/mys-types/src/transaction.rs#L102-L114
const ObjectArg = enumUnion({
	ImmOrOwnedObject: ObjectRef,
	SharedObject: object({
		objectId: ObjectID,
		// snake case in rust
		initialSharedVersion: JsonU64,
		mutable: boolean(),
	}),
	Receiving: ObjectRef,
});

// https://github.com/The-Social-Proof-Foundation/mys-core/blob/df41d5fa8127634ff4285671a01ead00e519f806/crates/mys-types/src/transaction.rs#L75-L80
const CallArg = enumUnion({
	Object: ObjectArg,
	Pure: object({
		bytes: BCSBytes,
	}),
	UnresolvedPure: object({
		value: unknown(),
	}),
	UnresolvedObject: object({
		objectId: ObjectID,
		version: optional(nullable(JsonU64)),
		digest: optional(nullable(string())),
		initialSharedVersion: optional(nullable(JsonU64)),
	}),
});

const TransactionExpiration = enumUnion({
	None: literal(true),
	Epoch: JsonU64,
});

export const SerializedTransactionDataV2 = object({
	version: literal(2),
	sender: nullish(MysAddress),
	expiration: nullish(TransactionExpiration),
	gasData: GasData,
	inputs: array(CallArg),
	commands: array(Command),
});

export type SerializedTransactionDataV2 = InferOutput<typeof SerializedTransactionDataV2>;
