// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysocial/mys/bcs';
import type { Transaction } from '@mysocial/mys/transactions';

import * as balance from './deps/0x0000000000000000000000000000000000000000000000000000000000000002/balance.js';
import * as object from './deps/0x0000000000000000000000000000000000000000000000000000000000000002/object.js';
import { normalizeMoveArguments } from './utils/index.js';
import type { RawTransactionArgument } from './utils/index.js';

export function Exchange() {
	return bcs.struct('Exchange', {
		id: object.UID(),
		wal: balance.Balance(),
		mys: balance.Balance(),
		rate: ExchangeRate(),
		admin: bcs.Address,
	});
}
export function AdminCap() {
	return bcs.struct('AdminCap', {
		id: object.UID(),
	});
}
export function ExchangeRate() {
	return bcs.struct('ExchangeRate', {
		wal: bcs.u64(),
		mys: bcs.u64(),
	});
}
export function init(packageAddress: string) {
	function new_exchange_rate(options: {
		arguments: [RawTransactionArgument<number | bigint>, RawTransactionArgument<number | bigint>];
	}) {
		const argumentsTypes = ['u64', 'u64'];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'new_exchange_rate',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function wal_to_mys(options: {
		arguments: [RawTransactionArgument<string>, RawTransactionArgument<number | bigint>];
	}) {
		const argumentsTypes = [`${packageAddress}::wal_exchange::ExchangeRate`, 'u64'];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'wal_to_mys',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function mys_to_wal(options: {
		arguments: [RawTransactionArgument<string>, RawTransactionArgument<number | bigint>];
	}) {
		const argumentsTypes = [`${packageAddress}::wal_exchange::ExchangeRate`, 'u64'];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'mys_to_wal',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function _new(options: { arguments: [] }) {
		const argumentsTypes: string[] = [];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'new',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function new_funded(options: {
		arguments: [RawTransactionArgument<string>, RawTransactionArgument<number | bigint>];
	}) {
		const argumentsTypes = [
			`0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<${packageAddress}::wal::WAL>`,
			'u64',
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'new_funded',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function add_wal(options: {
		arguments: [
			RawTransactionArgument<string>,
			RawTransactionArgument<string>,
			RawTransactionArgument<number | bigint>,
		];
	}) {
		const argumentsTypes = [
			`${packageAddress}::wal_exchange::Exchange`,
			`0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<${packageAddress}::wal::WAL>`,
			'u64',
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'add_wal',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function add_mys(options: {
		arguments: [
			RawTransactionArgument<string>,
			RawTransactionArgument<string>,
			RawTransactionArgument<number | bigint>,
		];
	}) {
		const argumentsTypes = [
			`${packageAddress}::wal_exchange::Exchange`,
			'0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<0x0000000000000000000000000000000000000000000000000000000000000002::mys::MYS>',
			'u64',
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'add_mys',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function add_all_wal(options: {
		arguments: [RawTransactionArgument<string>, RawTransactionArgument<string>];
	}) {
		const argumentsTypes = [
			`${packageAddress}::wal_exchange::Exchange`,
			`0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<${packageAddress}::wal::WAL>`,
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'add_all_wal',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function add_all_mys(options: {
		arguments: [RawTransactionArgument<string>, RawTransactionArgument<string>];
	}) {
		const argumentsTypes = [
			`${packageAddress}::wal_exchange::Exchange`,
			'0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<0x0000000000000000000000000000000000000000000000000000000000000002::mys::MYS>',
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'add_all_mys',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function check_admin(options: {
		arguments: [RawTransactionArgument<string>, RawTransactionArgument<string>];
	}) {
		const argumentsTypes = [
			`${packageAddress}::wal_exchange::Exchange`,
			`${packageAddress}::wal_exchange::AdminCap`,
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'check_admin',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function withdraw_wal(options: {
		arguments: [
			RawTransactionArgument<string>,
			RawTransactionArgument<number | bigint>,
			RawTransactionArgument<string>,
		];
	}) {
		const argumentsTypes = [
			`${packageAddress}::wal_exchange::Exchange`,
			'u64',
			`${packageAddress}::wal_exchange::AdminCap`,
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'withdraw_wal',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function withdraw_mys(options: {
		arguments: [
			RawTransactionArgument<string>,
			RawTransactionArgument<number | bigint>,
			RawTransactionArgument<string>,
		];
	}) {
		const argumentsTypes = [
			`${packageAddress}::wal_exchange::Exchange`,
			'u64',
			`${packageAddress}::wal_exchange::AdminCap`,
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'withdraw_mys',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function set_exchange_rate(options: {
		arguments: [
			RawTransactionArgument<string>,
			RawTransactionArgument<number | bigint>,
			RawTransactionArgument<number | bigint>,
			RawTransactionArgument<string>,
		];
	}) {
		const argumentsTypes = [
			`${packageAddress}::wal_exchange::Exchange`,
			'u64',
			'u64',
			`${packageAddress}::wal_exchange::AdminCap`,
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'set_exchange_rate',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function exchange_all_for_wal(options: {
		arguments: [RawTransactionArgument<string>, RawTransactionArgument<string>];
	}) {
		const argumentsTypes = [
			`${packageAddress}::wal_exchange::Exchange`,
			'0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<0x0000000000000000000000000000000000000000000000000000000000000002::mys::MYS>',
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'exchange_all_for_wal',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function exchange_for_wal(options: {
		arguments: [
			RawTransactionArgument<string>,
			RawTransactionArgument<string>,
			RawTransactionArgument<number | bigint>,
		];
	}) {
		const argumentsTypes = [
			`${packageAddress}::wal_exchange::Exchange`,
			'0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<0x0000000000000000000000000000000000000000000000000000000000000002::mys::MYS>',
			'u64',
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'exchange_for_wal',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function exchange_all_for_mys(options: {
		arguments: [RawTransactionArgument<string>, RawTransactionArgument<string>];
	}) {
		const argumentsTypes = [
			`${packageAddress}::wal_exchange::Exchange`,
			`0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<${packageAddress}::wal::WAL>`,
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'exchange_all_for_mys',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	function exchange_for_mys(options: {
		arguments: [
			RawTransactionArgument<string>,
			RawTransactionArgument<string>,
			RawTransactionArgument<number | bigint>,
		];
	}) {
		const argumentsTypes = [
			`${packageAddress}::wal_exchange::Exchange`,
			`0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<${packageAddress}::wal::WAL>`,
			'u64',
		];
		return (tx: Transaction) =>
			tx.moveCall({
				package: packageAddress,
				module: 'wal_exchange',
				function: 'exchange_for_mys',
				arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			});
	}
	return {
		new_exchange_rate,
		wal_to_mys,
		mys_to_wal,
		_new,
		new_funded,
		add_wal,
		add_mys,
		add_all_wal,
		add_all_mys,
		check_admin,
		withdraw_wal,
		withdraw_mys,
		set_exchange_rate,
		exchange_all_for_wal,
		exchange_for_wal,
		exchange_all_for_mys,
		exchange_for_mys,
	};
}
