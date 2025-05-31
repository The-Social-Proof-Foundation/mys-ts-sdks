// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0
import { execSync } from 'child_process';
import { mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { getFullnodeUrl, MysClient } from '@socialproof/mys/client';
import { FaucetRateLimitError, getFaucetHost, requestMysFromFaucetV2 } from '@socialproof/mys/faucet';
import { Ed25519Keypair } from '@socialproof/mys/keypairs/ed25519';
import { retry } from 'ts-retry-promise';

//@ts-ignore-next-line
export const MYS_BIN = process.env.VITE_MYS_BIN ?? `mys`;

//@ts-ignore-next-line
const DEFAULT_FAUCET_URL = process.env.VITE_FAUCET_URL ?? getFaucetHost('localnet');
//@ts-ignore-next-line
const DEFAULT_FULLNODE_URL = process.env.VITE_FULLNODE_URL ?? getFullnodeUrl('localnet');

export class TestToolbox {
	keypair: Ed25519Keypair;
	client: MysClient;
	configPath: string;

	constructor(keypair: Ed25519Keypair, client: MysClient, configPath: string) {
		this.keypair = keypair;
		this.client = client;
		this.configPath = configPath;
	}

	address() {
		return this.keypair.getPublicKey().toMysAddress();
	}

	public async getActiveValidators() {
		return (await this.client.getLatestMysSystemState()).activeValidators;
	}
}

export function getClient(): MysClient {
	return new MysClient({
		url: DEFAULT_FULLNODE_URL,
	});
}

// TODO: expose these testing utils from @socialproof/mys
export async function setupMysClient() {
	const keypair = Ed25519Keypair.generate();
	const address = keypair.getPublicKey().toMysAddress();
	const client = getClient();
	await retry(() => requestMysFromFaucetV2({ host: DEFAULT_FAUCET_URL, recipient: address }), {
		backoff: 'EXPONENTIAL',
		// overall timeout in 60 seconds
		timeout: 1000 * 60,
		// skip retry if we hit the rate-limit error
		retryIf: (error: any) => !(error instanceof FaucetRateLimitError),
		logger: (msg) => console.warn('Retrying requesting from faucet: ' + msg),
	});

	const tmpDirPath = path.join(tmpdir(), 'config-');
	const tmpDir = await mkdtemp(tmpDirPath);
	const configPath = path.join(tmpDir, 'client.yaml');
	execSync(`${MYS_BIN} client --yes --client.config ${configPath}`, { encoding: 'utf-8' });
	return new TestToolbox(keypair, client, configPath);
}
