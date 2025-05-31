// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';
import type { MysClient } from '@socialproof/mys/client';
import { MysGraphQLClient } from '@socialproof/mys/graphql';
import { graphql } from '@socialproof/mys/graphql/schemas/latest';
import { fromBase64, normalizeMysAddress } from '@socialproof/mys/utils';

import { ZkSendLink } from './claim.js';
import type { ZkBagContractOptions } from './zk-bag.js';
import { getContractIds } from './zk-bag.js';

const ListCreatedLinksQuery = graphql(`
	query listCreatedLinks($address: MysAddress!, $function: String!, $cursor: String) {
		transactionBlocks(
			last: 10
			before: $cursor
			filter: { sentAddress: $address, function: $function }
		) {
			pageInfo {
				startCursor
				hasPreviousPage
			}
			nodes {
				effects {
					timestamp
				}
				digest
				bcs
			}
		}
	}
`);

export async function listCreatedLinks({
	address,
	cursor,
	network,
	contract = getContractIds(network),
	fetch: fetchFn,
	...linkOptions
}: {
	address: string;
	contract?: ZkBagContractOptions;
	cursor?: string;
	network?: 'mainnet' | 'testnet';

	// Link options:
	host?: string;
	path?: string;
	claimApi?: string;
	client?: MysClient;
	fetch?: typeof fetch;
}) {
	const gqlClient = new MysGraphQLClient({
		url:
			network === 'testnet'
				? 'https://testnet.mysocial.network/graphql'
				: 'https://mainnet.mysocial.network/graphql',
		fetch: fetchFn,
	});

	const packageId = normalizeMysAddress(contract.packageId);

	const page = await gqlClient.query({
		query: ListCreatedLinksQuery,
		variables: {
			address,
			cursor,
			function: `${packageId}::zk_bag::new`,
		},
	});

	const transactionBlocks = page.data?.transactionBlocks;

	if (!transactionBlocks || page.errors?.length) {
		throw new Error('Failed to load created links');
	}

	const links = (
		await Promise.all(
			transactionBlocks.nodes.map(async (node) => {
				if (!node.bcs) {
					return null;
				}

				const kind = bcs.TransactionData.parse(fromBase64(node.bcs)).V1.kind;

				if (!kind?.ProgrammableTransaction) {
					return null;
				}

				const { inputs, commands } = kind.ProgrammableTransaction;

				const fn = commands.find(
					(command) =>
						command.MoveCall?.package === packageId &&
						command.MoveCall.module === 'zk_bag' &&
						command.MoveCall.function === 'new',
				);

				if (!fn?.MoveCall) {
					return null;
				}

				const addressArg = fn.MoveCall.arguments[1];

				if (addressArg.$kind !== 'Input') {
					throw new Error('Invalid address argument');
				}

				const input = inputs[addressArg.Input];

				if (!input.Pure) {
					throw new Error('Expected Address input to be a Pure value');
				}

				const address = bcs.Address.fromBase64(input.Pure.bytes);

				const link = new ZkSendLink({
					network,
					address,
					contract,
					isContractLink: true,
					...linkOptions,
				});

				await link.loadAssets();

				return {
					link,
					claimed: !!link.claimed,
					assets: link.assets!,
					digest: node.digest,
					createdAt: node.effects?.timestamp!,
				};
			}),
		)
	).reverse();

	return {
		cursor: transactionBlocks.pageInfo.startCursor,
		hasNextPage: transactionBlocks.pageInfo.hasPreviousPage,
		links: links.filter((link): link is NonNullable<typeof link> => link !== null),
	};
}
