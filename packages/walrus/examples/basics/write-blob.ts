// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Agent, setGlobalDispatcher } from 'undici';

import { WalrusClient } from '../../src/client.js';
import { getFundedKeypair } from '../funded-keypair.js';

// Node connect timeout is 10 seconds, and walrus nodes can be slow to respond
setGlobalDispatcher(
	new Agent({
		connectTimeout: 60_000,
		connect: { timeout: 60_000 },
	}),
);

const client = new SuiClient({
	url: getFullnodeUrl('testnet'),
	network: 'testnet',
}).$extend(
	WalrusClient.experimental_asClientExtension({
		storageNodeClientOptions: {
			timeout: 60_000,
		},
	}),
);

async function uploadFile() {
	const keypair = await getFundedKeypair();

	const file = new TextEncoder().encode('Hello from the TS SDK!!!\n');

	const { blobId } = await client.walrus.writeBlob({
		blob: file,
		deletable: false,
		epochs: 3,
		signer: keypair,
	});

	console.log(blobId);
}

uploadFile().catch(console.error);
