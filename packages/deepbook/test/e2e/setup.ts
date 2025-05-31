// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import path from 'path';
import type {
	DevInspectResults,
	MysObjectChangeCreated,
	MysObjectChangePublished,
	MysTransactionBlockResponse,
} from '@socialproof/mys/client';
import { getFullnodeUrl, MysClient } from '@socialproof/mys/client';
import { FaucetRateLimitError, getFaucetHost, requestMysFromFaucetV2 } from '@socialproof/mys/faucet';
import { Ed25519Keypair } from '@socialproof/mys/keypairs/ed25519';
import { Transaction } from '@socialproof/mys/transactions';
import type { ContainerRuntimeClient } from 'testcontainers';
import { getContainerRuntimeClient } from 'testcontainers';
import { retry } from 'ts-retry-promise';
import { expect, inject } from 'vitest';

import { DeepBookClient } from '../../src/index.js';
import type { PoolSummary } from '../../src/types/index.js';
import { FLOAT_SCALING_FACTOR, NORMALIZED_MYS_COIN_TYPE } from '../../src/utils/index.js';

const DEFAULT_FAUCET_URL = process.env.FAUCET_URL ?? getFaucetHost('localnet');
const DEFAULT_FULLNODE_URL = process.env.FULLNODE_URL ?? getFullnodeUrl('localnet');

export const DEFAULT_TICK_SIZE = 1n * FLOAT_SCALING_FACTOR;
export const DEFAULT_LOT_SIZE = 1n;

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

	const configDir = path.join('/test-data', `${Math.random().toString(36).substring(2, 15)}`);
	await execMysTools(['mkdir', '-p', configDir]);
	const configPath = path.join(configDir, 'client.yaml');
	await execMysTools(['mys', 'client', '--yes', '--client.config', configPath]);
	return new TestToolbox(keypair, client, configPath);
}

export async function publishPackage(packageName: string, toolbox?: TestToolbox) {
	// TODO: We create a unique publish address per publish, but we really could share one for all publishes.
	if (!toolbox) {
		toolbox = await setupMysClient();
	}

	const result = await execMysTools([
		'mys',
		'move',
		'--client.config',
		toolbox.configPath,
		'build',
		'--dump-bytecode-as-base64',
		'--path',
		`/test-data/${packageName}`,
	]);

	if (!result.stdout.includes('{')) {
		console.error(result.stdout);
		throw new Error('Failed to publish package');
	}

	const { modules, dependencies } = JSON.parse(
		result.stdout.slice(result.stdout.indexOf('{'), result.stdout.lastIndexOf('}') + 1),
	);

	const tx = new Transaction();
	const cap = tx.publish({
		modules,
		dependencies,
	});

	// Transfer the upgrade capability to the sender so they can upgrade the package later if they want.
	tx.transferObjects([cap], toolbox.address());

	const { digest } = await toolbox.client.signAndExecuteTransaction({
		transaction: tx,
		signer: toolbox.keypair,
	});

	const publishTxn = await toolbox.client.waitForTransaction({
		digest: digest,
		options: { showObjectChanges: true, showEffects: true },
	});

	expect(publishTxn.effects?.status.status).toEqual('success');

	const packageId = ((publishTxn.objectChanges?.filter(
		(a) => a.type === 'published',
	) as MysObjectChangePublished[]) ?? [])[0]?.packageId.replace(/^(0x)(0+)/, '0x') as string;

	expect(packageId).toBeTypeOf('string');

	console.info(`Published package ${packageId} from address ${toolbox.address()}}`);

	return { packageId, publishTxn };
}

export async function setupPool(toolbox: TestToolbox): Promise<PoolSummary> {
	const { packageId } = await publishPackage('test_coin', toolbox);
	const baseAsset = `${packageId}::test::TEST`;
	const quoteAsset = NORMALIZED_MYS_COIN_TYPE;
	const deepbook = new DeepBookClient(toolbox.client);
	const tx = deepbook.createPool(baseAsset, quoteAsset, DEFAULT_TICK_SIZE, DEFAULT_LOT_SIZE);
	const resp = await executeTransaction(toolbox, tx);
	const event = resp.events?.find((e) => e.type.includes('PoolCreated')) as any;
	return {
		poolId: event.parsedJson.pool_id,
		baseAsset,
		quoteAsset,
	};
}

export async function setupDeepbookAccount(toolbox: TestToolbox): Promise<string> {
	const deepbook = new DeepBookClient(toolbox.client);
	const tx = deepbook.createAccount(toolbox.address());
	const resp = await executeTransaction(toolbox, tx);

	const accountCap = ((resp.objectChanges?.filter(
		(a) => a.type === 'created',
	) as MysObjectChangeCreated[]) ?? [])[0].objectId;
	return accountCap;
}

export async function executeTransaction(
	toolbox: TestToolbox,
	tx: Transaction,
): Promise<MysTransactionBlockResponse> {
	const resp = await toolbox.client.signAndExecuteTransaction({
		signer: toolbox.keypair,
		transaction: tx,
		options: {
			showEffects: true,
			showEvents: true,
			showObjectChanges: true,
		},
	});
	await toolbox.client.waitForTransaction({
		digest: resp.digest,
	});
	expect(resp.effects?.status.status).toEqual('success');
	return resp;
}

export async function devInspectTransaction(
	toolbox: TestToolbox,
	tx: Transaction,
): Promise<DevInspectResults> {
	return await toolbox.client.devInspectTransactionBlock({
		transactionBlock: tx,
		sender: toolbox.address(),
	});
}

export async function execMysTools(
	command: string[],
	options?: Parameters<ContainerRuntimeClient['container']['exec']>[2],
) {
	const client = await getContainerRuntimeClient();
	const MYS_TOOLS_CONTAINER_ID = inject('mysToolsContainerId');
	const container = client.container.getById(MYS_TOOLS_CONTAINER_ID);

	const result = await client.container.exec(container, command, options);

	if (result.stderr) {
		console.log(result.stderr);
	}

	return result;
}
