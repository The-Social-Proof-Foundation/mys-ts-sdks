// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable */

import { Transaction } from '@socialproof/mys/transactions';

const _demoFunction = () => {
	const transaction = new Transaction();

	transaction.moveCall({
		target: '@mvr/app/2::demo::test',
		typeArguments: [
			'@mvr/app::type::Type',
			`@mvr/app::type::Type2`,
			// eslint-disable-next-line prettier/prettier
			'@mvr/app::type::Type<@kiosk/core::kiosk::Kiosk, bool>',
			// eslint-disable-next-line prettier/prettier
			'app.mys/app::t::T',
			'@pkg/qwer::mvr_b::V2',
		],
	});

	transaction.makeMoveVec({
		type: '@pkg/qwer::mvr_a::V1',
		elements: [],
	});
};
