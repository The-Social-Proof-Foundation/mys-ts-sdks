// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import path from 'path';
import type { ContainerRuntimeClient } from 'testcontainers';
import { getContainerRuntimeClient } from 'testcontainers';
import { retry } from 'ts-retry-promise';
import { expect, inject } from 'vitest';
import { WebSocket } from 'ws';

import type { MysObjectChangePublished } from '../../../src/client/index.js';
import { getFullnodeUrl, MysClient, MysHTTPTransport } from '../../../src/client/index.js';
import type { Keypair } from '../../../src/cryptography/index.js';
import {
	FaucetRateLimitError,
	getFaucetHost,
	requestMysFromFaucetV2,
} from '../../../src/faucet/index.js';
import { Ed25519Keypair } from '../../../src/keypairs/ed25519/index.js';
import { Transaction, UpgradePolicy } from '../../../src/transactions/index.js';
import { MYS_TYPE_ARG } from '../../../src/utils/index.js';

const DEFAULT_FAUCET_URL = import.meta.env.FAUCET_URL ?? getFaucetHost('localnet');
const DEFAULT_FULLNODE_URL = import.meta.env.FULLNODE_URL ?? getFullnodeUrl('localnet');

const MYS_TOOLS_CONTAINER_ID = inject('mysToolsContainerId');

export const DEFAULT_RECIPIENT =
	'0x0c567ffdf8162cb6d51af74be0199443b92e823d4ba6ced24de5c6c463797d46';
export const DEFAULT_RECIPIENT_2 =
	'0xbb967ddbebfee8c40d8fdd2c24cb02452834cd3a7061d18564448f900eb9e66d';
export const DEFAULT_GAS_BUDGET = 10000000;
export const DEFAULT_SEND_AMOUNT = 1000;

class TestPackageRegistry {
	static registries: Map<string, TestPackageRegistry> = new Map();

	static forUrl(url: string) {
		if (!this.registries.has(url)) {
			this.registries.set(url, new TestPackageRegistry());
		}
		return this.registries.get(url)!;
	}

	#packages: Map<string, string>;

	constructor() {
		this.#packages = new Map();
	}

	async getPackage(name: string, toolbox?: TestToolbox) {
		if (!this.#packages.has(name)) {
			this.#packages.set(name, (await publishPackage(name, toolbox)).packageId);
		}

		return this.#packages.get(name)!;
	}
}

export class TestToolbox {
	keypair: Ed25519Keypair;
	client: MysClient;
	registry: TestPackageRegistry;
	configPath: string;

	constructor(keypair: Ed25519Keypair, url: string = DEFAULT_FULLNODE_URL, configPath: string) {
		this.keypair = keypair;
		this.client = new MysClient({
			transport: new MysHTTPTransport({
				url,
				WebSocketConstructor: WebSocket as never,
			}),
		});
		this.registry = TestPackageRegistry.forUrl(url);
		this.configPath = configPath;
	}

	address() {
		return this.keypair.getPublicKey().toMysAddress();
	}

	async getGasObjectsOwnedByAddress() {
		return await this.client.getCoins({
			owner: this.address(),
			coinType: MYS_TYPE_ARG,
		});
	}

	public async getActiveValidators() {
		return (await this.client.getLatestMysSystemState()).activeValidators;
	}

	public async getPackage(path: string) {
		return this.registry.getPackage(path, this);
	}

	async mintNft(name: string = 'Test NFT') {
		const packageId = await this.getPackage('demo-bear');
		return (tx: Transaction) => {
			return tx.moveCall({
				target: `${packageId}::demo_bear::new`,
				arguments: [tx.pure.string(name)],
			});
		};
	}
}

export function getClient(url = DEFAULT_FULLNODE_URL): MysClient {
	return new MysClient({
		transport: new MysHTTPTransport({
			url,
			WebSocketConstructor: WebSocket as never,
		}),
	});
}

export async function setup(options: { graphQLURL?: string; rpcURL?: string } = {}) {
	const keypair = Ed25519Keypair.generate();
	const address = keypair.getPublicKey().toMysAddress();

	const configDir = path.join('/test-data', `${Math.random().toString(36).substring(2, 15)}`);
	await execMysTools(['mkdir', '-p', configDir]);
	const configPath = path.join(configDir, 'client.yaml');
	return setupWithFundedAddress(keypair, address, configPath, options);
}

export async function setupWithFundedAddress(
	keypair: Ed25519Keypair,
	address: string,
	configPath: string,
	{ rpcURL }: { graphQLURL?: string; rpcURL?: string } = {},
) {
	const client = getClient(rpcURL ?? DEFAULT_FULLNODE_URL);
	await retry(
		async () => await requestMysFromFaucetV2({ host: DEFAULT_FAUCET_URL, recipient: address }),
		{
			backoff: 'EXPONENTIAL',
			// overall timeout in 60 seconds
			timeout: 1000 * 60,
			// skip retry if we hit the rate-limit error
			retryIf: (error: any) => !(error instanceof FaucetRateLimitError),
			logger: (msg) => console.warn('Retrying requesting from faucet: ' + msg),
		},
	);

	await retry(
		async () => {
			const balance = await client.getBalance({ owner: address });

			if (balance.totalBalance === '0') {
				throw new Error('Balance is still 0');
			}
		},
		{
			backoff: () => 3000,
			timeout: 60 * 1000,
			retryIf: () => true,
		},
	);

	await execMysTools(['mys', 'client', '--yes', '--client.config', configPath]);
	return new TestToolbox(keypair, rpcURL, configPath);
}

export async function publishPackage(packageName: string, toolbox?: TestToolbox) {
	// TODO: We create a unique publish address per publish, but we really could share one for all publishes.
	if (!toolbox) {
		toolbox = await setup();
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

	let resultJson;
	try {
		resultJson = JSON.parse(
			result.stdout.slice(result.stdout.indexOf('{'), result.stdout.lastIndexOf('}') + 1),
		);
	} catch (error) {
		console.error(result.stdout);
		throw new Error('Failed to publish package');
	}

	const { modules, dependencies } = resultJson;

	const tx = new Transaction();
	const cap = tx.publish({
		modules,
		dependencies,
	});

	// Transfer the upgrade capability to the sender so they can upgrade the package later if they want.
	tx.transferObjects([cap], tx.pure.address(await toolbox.address()));

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

	return { packageId, publishTxn };
}

export async function upgradePackage(
	packageId: string,
	capId: string,
	packageName: string,
	toolbox?: TestToolbox,
) {
	// TODO: We create a unique publish address per publish, but we really could share one for all publishes.
	if (!toolbox) {
		toolbox = await setup();
	}
	const { stdout } = await execMysTools([
		'mys',
		'move',
		'--client.config',
		toolbox.configPath,
		'build',
		'--dump-bytecode-as-base64',
		'--path',
		`/test-data/${packageName}`,
	]);

	if (!stdout.includes('{')) {
		console.log(stdout);

		throw new Error('Failed to upgrade package');
	}

	const { modules, dependencies, digest } = JSON.parse(stdout.slice(stdout.indexOf('{')));

	const tx = new Transaction();

	const cap = tx.object(capId);
	const ticket = tx.moveCall({
		target: '0x2::package::authorize_upgrade',
		arguments: [cap, tx.pure.u8(UpgradePolicy.COMPATIBLE), tx.pure.vector('u8', digest)],
	});

	const receipt = tx.upgrade({
		modules,
		dependencies,
		package: packageId,
		ticket,
	});

	tx.moveCall({
		target: '0x2::package::commit_upgrade',
		arguments: [cap, receipt],
	});

	const result = await toolbox.client.signAndExecuteTransaction({
		transaction: tx,
		signer: toolbox.keypair,
		options: {
			showEffects: true,
			showObjectChanges: true,
		},
	});

	expect(result.effects?.status.status).toEqual('success');
}

export function getRandomAddresses(n: number): string[] {
	return Array(n)
		.fill(null)
		.map(() => {
			const keypair = Ed25519Keypair.generate();
			return keypair.getPublicKey().toMysAddress();
		});
}

export async function payMys(
	client: MysClient,
	signer: Keypair,
	numRecipients: number = 1,
	recipients?: string[],
	amounts?: number[],
	coinId?: string,
) {
	const tx = new Transaction();

	recipients = recipients ?? getRandomAddresses(numRecipients);
	amounts = amounts ?? Array(numRecipients).fill(DEFAULT_SEND_AMOUNT);

	expect(recipients.length === amounts.length, 'recipients and amounts must be the same length');

	coinId =
		coinId ??
		(
			await client.getCoins({
				owner: signer.getPublicKey().toMysAddress(),
				coinType: '0x2::mys::MYS',
			})
		).data[0].coinObjectId;

	recipients.forEach((recipient, i) => {
		const coin = tx.splitCoins(coinId!, [amounts![i]]);
		tx.transferObjects([coin], tx.pure.address(recipient));
	});

	const txn = await client.signAndExecuteTransaction({
		transaction: tx,
		signer,
		options: {
			showEffects: true,
			showObjectChanges: true,
		},
	});

	await client.waitForTransaction({
		digest: txn.digest,
	});
	expect(txn.effects?.status.status).toEqual('success');
	return txn;
}

export async function executePayMysNTimes(
	client: MysClient,
	signer: Keypair,
	nTimes: number,
	numRecipientsPerTxn: number = 1,
	recipients?: string[],
	amounts?: number[],
) {
	const txns = [];
	for (let i = 0; i < nTimes; i++) {
		// must await here to make sure the txns are executed in order
		txns.push(await payMys(client, signer, numRecipientsPerTxn, recipients, amounts));
	}
	return txns;
}

const client = await getContainerRuntimeClient();

export async function execMysTools(
	command: string[],
	options?: Parameters<ContainerRuntimeClient['container']['exec']>[2],
) {
	const container = client.container.getById(MYS_TOOLS_CONTAINER_ID);

	const result = await client.container.exec(container, command, options);

	if (result.stderr) {
		console.log(result.stderr);
	}

	return result;
}
