// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { inject } from 'vitest';

Object.entries({
	FAUCET_URL: `http://localhost:${inject('faucetPort')}`,
	FULLNODE_URL: `http://localhost:${inject('localnetPort')}`,
	GRAPHQL_URL: `http://localhost:${inject('graphqlPort')}`,
}).forEach(([key, value]) => {
	process.env[key] = value;
});
