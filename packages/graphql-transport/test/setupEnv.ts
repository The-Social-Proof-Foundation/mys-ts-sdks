// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { inject } from 'vitest';

Object.entries({
	FAUCET_URL: `http://localhost:${inject('faucetPort')}`,
	FULLNODE_URL: `http://localhost:${inject('fullnodePort')}`,
	INDEXER_URL: `http://localhost:${inject('indexerPort')}`,
	GRAPHQL_URL: `http://localhost:${inject('graphqlPort')}`,
}).forEach(([key, value]) => {
	process.env[key] = value;
});
