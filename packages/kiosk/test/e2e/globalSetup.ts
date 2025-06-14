// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { resolve } from 'path';
import { GenericContainer, Network, PullPolicy } from 'testcontainers';
import type { GlobalSetupContext } from 'vitest/node';

declare module 'vitest' {
	export interface ProvidedContext {
		localnetPort: number;
		graphqlPort: number;
		faucetPort: number;
		mysToolsContainerId: string;
	}
}

const MYS_TOOLS_TAG =
	process.env.MYS_TOOLS_TAG || process.arch === 'arm64'
		? '28dc33fc8fc43e50819c42c22b0d557b889c107e-arm64'
		: '28dc33fc8fc43e50819c42c22b0d557b889c107e';

export default async function setup({ provide }: GlobalSetupContext) {
	console.log('Starting test containers');
	const network = await new Network().start();

	const pg = await new GenericContainer('postgres')
		.withEnvironment({
			POSTGRES_USER: 'postgres',
			POSTGRES_PASSWORD: 'postgrespw',
			POSTGRES_DB: 'mys_indexer_v2',
		})
		.withCommand(['-c', 'max_connections=500'])

		.withExposedPorts(5432)
		.withNetwork(network)
		.withPullPolicy(PullPolicy.alwaysPull())
		.start();

	const localnet = await new GenericContainer(`mysten/mys-tools:${MYS_TOOLS_TAG}`)
		.withCommand([
			'mys',
			'start',
			'--with-faucet',
			'--force-regenesis',
			'--with-indexer',
			'--pg-port',
			'5432',
			'--pg-db-name',
			'mys_indexer_v2',
			'--pg-host',
			pg.getIpAddress(network.getName()),
			'--pg-user',
			'postgres',
			'--pg-password',
			'postgrespw',
			'--with-graphql',
		])
		.withCopyDirectoriesToContainer([
			{ source: resolve(__dirname, './data'), target: '/test-data' },
		])
		.withNetwork(network)
		.withExposedPorts(9000, 9123, 9124, 9125)
		.withLogConsumer((stream) => {
			stream.on('data', (data) => {
				console.log(data.toString());
			});
		})
		.start();

	provide('faucetPort', localnet.getMappedPort(9123));
	provide('localnetPort', localnet.getMappedPort(9000));
	provide('graphqlPort', localnet.getMappedPort(9125));
	provide('mysToolsContainerId', localnet.getId());
}
