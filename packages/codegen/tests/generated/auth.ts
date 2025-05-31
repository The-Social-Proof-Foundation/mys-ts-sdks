// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs, type BcsType } from '@mysocial/mys/bcs';
import { type Transaction } from '@mysocial/mys/transactions';
import { normalizeMoveArguments, type RawTransactionArgument } from './utils/index.js';
export function Authenticated() {
	return bcs.enum('Authenticated', {
		Sender: bcs.Address,
		Object: bcs.Address,
	});
}
export function Authorized() {
	return bcs.enum('Authorized', {
		Address: bcs.Address,
		ObjectID: bcs.Address,
	});
}
export function init(packageAddress: string) {
	function authenticate_sender(options: { arguments: [] }) {
		const argumentsTypes = [];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'auth',
				function: 'authenticate_sender',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function authenticate_with_object<T0 extends BcsType<any>>(options: {
		arguments: [RawTransactionArgument<T0>];
		typeArguments: [string];
	}) {
		const argumentsTypes = [`${options.typeArguments[0]}`];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'auth',
				function: 'authenticate_with_object',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
				typeArguments: options.typeArguments,
			});
	}
	function authorized_address(options: { arguments: [RawTransactionArgument<string>] }) {
		const argumentsTypes = ['address'];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'auth',
				function: 'authorized_address',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function authorized_object(options: { arguments: [RawTransactionArgument<string>] }) {
		const argumentsTypes = [
			'0x0000000000000000000000000000000000000000000000000000000000000002::object::ID',
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'auth',
				function: 'authorized_object',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function matches(options: {
		arguments: [RawTransactionArgument<string>, RawTransactionArgument<string>];
	}) {
		const argumentsTypes = [
			`${packageAddress}::auth::Authenticated`,
			`${packageAddress}::auth::Authorized`,
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'auth',
				function: 'matches',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	return {
		authenticate_sender,
		authenticate_with_object,
		authorized_address,
		authorized_object,
		matches,
	};
}
