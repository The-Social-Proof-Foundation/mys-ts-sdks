// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0
import { fromBase58, toBase64, toHex } from '@mysocial/bcs';

import type { Signer } from '../cryptography/index.js';
import { Experimental_BaseClient } from '../experimental/client.js';
import { JSONRpcTransport } from '../experimental/transports/jsonRPC.js';
import type {
	Experimental_MysClientTypes,
	SelfRegisteringClientExtension,
} from '../experimental/types.js';
import type { Transaction } from '../transactions/index.js';
import { isTransaction } from '../transactions/index.js';
import {
	isValidMysAddress,
	isValidMysObjectId,
	isValidTransactionDigest,
	normalizeMysAddress,
	normalizeMysObjectId,
} from '../utils/mys-types.js';
import { normalizeMysNSName } from '../utils/mysns.js';
import { MysHTTPTransport } from './http-transport.js';
import type { MysTransport } from './http-transport.js';
import type {
	AddressMetrics,
	AllEpochsAddressMetrics,
	Checkpoint,
	CheckpointPage,
	CoinBalance,
	CoinMetadata,
	CoinSupply,
	CommitteeInfo,
	DelegatedStake,
	DevInspectResults,
	DevInspectTransactionBlockParams,
	DryRunTransactionBlockParams,
	DryRunTransactionBlockResponse,
	DynamicFieldPage,
	EpochInfo,
	EpochMetricsPage,
	EpochPage,
	ExecuteTransactionBlockParams,
	GetAllBalancesParams,
	GetAllCoinsParams,
	GetBalanceParams,
	GetCheckpointParams,
	GetCheckpointsParams,
	GetCoinMetadataParams,
	GetCoinsParams,
	GetCommitteeInfoParams,
	GetDynamicFieldObjectParams,
	GetDynamicFieldsParams,
	GetLatestCheckpointSequenceNumberParams,
	GetLatestMysSystemStateParams,
	GetMoveFunctionArgTypesParams,
	GetNormalizedMoveFunctionParams,
	GetNormalizedMoveModuleParams,
	GetNormalizedMoveModulesByPackageParams,
	GetNormalizedMoveStructParams,
	GetObjectParams,
	GetOwnedObjectsParams,
	GetProtocolConfigParams,
	GetReferenceGasPriceParams,
	GetStakesByIdsParams,
	GetStakesParams,
	GetTotalSupplyParams,
	GetTransactionBlockParams,
	MoveCallMetrics,
	MultiGetObjectsParams,
	MultiGetTransactionBlocksParams,
	NetworkMetrics,
	ObjectRead,
	Order,
	PaginatedCoins,
	PaginatedEvents,
	PaginatedObjectsResponse,
	PaginatedTransactionResponse,
	ProtocolConfig,
	QueryEventsParams,
	QueryTransactionBlocksParams,
	ResolvedNameServiceNames,
	ResolveNameServiceAddressParams,
	ResolveNameServiceNamesParams,
	SubscribeEventParams,
	SubscribeTransactionParams,
	MysEvent,
	MysMoveFunctionArgType,
	MysMoveNormalizedFunction,
	MysMoveNormalizedModule,
	MysMoveNormalizedModules,
	MysMoveNormalizedStruct,
	MysObjectResponse,
	MysObjectResponseQuery,
	MysSystemStateSummary,
	MysTransactionBlockResponse,
	MysTransactionBlockResponseQuery,
	TransactionEffects,
	TryGetPastObjectParams,
	Unsubscribe,
	ValidatorsApy,
	VerifyZkLoginSignatureParams,
	ZkLoginVerifyResult,
} from './types/index.js';

export interface PaginationArguments<Cursor> {
	/** Optional paging cursor */
	cursor?: Cursor;
	/** Maximum item returned per page */
	limit?: number | null;
}

export interface OrderArguments {
	order?: Order | null;
}

/**
 * Configuration options for the MysClient
 * You must provide either a `url` or a `transport`
 */
export type MysClientOptions = NetworkOrTransport & {
	network?: Experimental_MysClientTypes.Network;
};

type NetworkOrTransport =
	| {
			url: string;
			transport?: never;
	  }
	| {
			transport: MysTransport;
			url?: never;
	  };

const MYS_CLIENT_BRAND = Symbol.for('@mysocial/MysClient') as never;

export function isMysClient(client: unknown): client is MysClient {
	return (
		typeof client === 'object' && client !== null && (client as any)[MYS_CLIENT_BRAND] === true
	);
}

export class MysClient extends Experimental_BaseClient implements SelfRegisteringClientExtension {
	core: JSONRpcTransport = new JSONRpcTransport(this);
	jsonRpc = this;
	protected transport: MysTransport;

	get [MYS_CLIENT_BRAND]() {
		return true;
	}

	/**
	 * Establish a connection to a Mys RPC endpoint
	 *
	 * @param options configuration options for the API Client
	 */
	constructor(options: MysClientOptions) {
		super({ network: options.network ?? 'unknown' });
		this.transport = options.transport ?? new MysHTTPTransport({ url: options.url });
	}

	async getRpcApiVersion({ signal }: { signal?: AbortSignal } = {}): Promise<string | undefined> {
		const resp = await this.transport.request<{ info: { version: string } }>({
			method: 'rpc.discover',
			params: [],
			signal,
		});

		return resp.info.version;
	}

	/**
	 * Get all Coin<`coin_type`> objects owned by an address.
	 */
	async getCoins(input: GetCoinsParams): Promise<PaginatedCoins> {
		if (!input.owner || !isValidMysAddress(normalizeMysAddress(input.owner))) {
			throw new Error('Invalid Mys address');
		}

		return await this.transport.request({
			method: 'mysx_getCoins',
			params: [input.owner, input.coinType, input.cursor, input.limit],
			signal: input.signal,
		});
	}

	/**
	 * Get all Coin objects owned by an address.
	 */
	async getAllCoins(input: GetAllCoinsParams): Promise<PaginatedCoins> {
		if (!input.owner || !isValidMysAddress(normalizeMysAddress(input.owner))) {
			throw new Error('Invalid Mys address');
		}

		return await this.transport.request({
			method: 'mysx_getAllCoins',
			params: [input.owner, input.cursor, input.limit],
			signal: input.signal,
		});
	}

	/**
	 * Get the total coin balance for one coin type, owned by the address owner.
	 */
	async getBalance(input: GetBalanceParams): Promise<CoinBalance> {
		if (!input.owner || !isValidMysAddress(normalizeMysAddress(input.owner))) {
			throw new Error('Invalid Mys address');
		}
		return await this.transport.request({
			method: 'mysx_getBalance',
			params: [input.owner, input.coinType],
			signal: input.signal,
		});
	}

	/**
	 * Get the total coin balance for all coin types, owned by the address owner.
	 */
	async getAllBalances(input: GetAllBalancesParams): Promise<CoinBalance[]> {
		if (!input.owner || !isValidMysAddress(normalizeMysAddress(input.owner))) {
			throw new Error('Invalid Mys address');
		}
		return await this.transport.request({
			method: 'mysx_getAllBalances',
			params: [input.owner],
			signal: input.signal,
		});
	}

	/**
	 * Fetch CoinMetadata for a given coin type
	 */
	async getCoinMetadata(input: GetCoinMetadataParams): Promise<CoinMetadata | null> {
		return await this.transport.request({
			method: 'mysx_getCoinMetadata',
			params: [input.coinType],
			signal: input.signal,
		});
	}

	/**
	 *  Fetch total supply for a coin
	 */
	async getTotalSupply(input: GetTotalSupplyParams): Promise<CoinSupply> {
		return await this.transport.request({
			method: 'mysx_getTotalSupply',
			params: [input.coinType],
			signal: input.signal,
		});
	}

	/**
	 * Invoke any RPC method
	 * @param method the method to be invoked
	 * @param args the arguments to be passed to the RPC request
	 */
	async call<T = unknown>(
		method: string,
		params: unknown[],
		{ signal }: { signal?: AbortSignal } = {},
	): Promise<T> {
		return await this.transport.request({ method, params, signal });
	}

	/**
	 * Get Move function argument types like read, write and full access
	 */
	async getMoveFunctionArgTypes(
		input: GetMoveFunctionArgTypesParams,
	): Promise<MysMoveFunctionArgType[]> {
		return await this.transport.request({
			method: 'mys_getMoveFunctionArgTypes',
			params: [input.package, input.module, input.function],
			signal: input.signal,
		});
	}

	/**
	 * Get a map from module name to
	 * structured representations of Move modules
	 */
	async getNormalizedMoveModulesByPackage(
		input: GetNormalizedMoveModulesByPackageParams,
	): Promise<MysMoveNormalizedModules> {
		return await this.transport.request({
			method: 'mys_getNormalizedMoveModulesByPackage',
			params: [input.package],
			signal: input.signal,
		});
	}

	/**
	 * Get a structured representation of Move module
	 */
	async getNormalizedMoveModule(
		input: GetNormalizedMoveModuleParams,
	): Promise<MysMoveNormalizedModule> {
		return await this.transport.request({
			method: 'mys_getNormalizedMoveModule',
			params: [input.package, input.module],
			signal: input.signal,
		});
	}

	/**
	 * Get a structured representation of Move function
	 */
	async getNormalizedMoveFunction(
		input: GetNormalizedMoveFunctionParams,
	): Promise<MysMoveNormalizedFunction> {
		return await this.transport.request({
			method: 'mys_getNormalizedMoveFunction',
			params: [input.package, input.module, input.function],
			signal: input.signal,
		});
	}

	/**
	 * Get a structured representation of Move struct
	 */
	async getNormalizedMoveStruct(
		input: GetNormalizedMoveStructParams,
	): Promise<MysMoveNormalizedStruct> {
		return await this.transport.request({
			method: 'mys_getNormalizedMoveStruct',
			params: [input.package, input.module, input.struct],
			signal: input.signal,
		});
	}

	/**
	 * Get all objects owned by an address
	 */
	async getOwnedObjects(input: GetOwnedObjectsParams): Promise<PaginatedObjectsResponse> {
		if (!input.owner || !isValidMysAddress(normalizeMysAddress(input.owner))) {
			throw new Error('Invalid Mys address');
		}

		return await this.transport.request({
			method: 'mysx_getOwnedObjects',
			params: [
				input.owner,
				{
					filter: input.filter,
					options: input.options,
				} as MysObjectResponseQuery,
				input.cursor,
				input.limit,
			],
			signal: input.signal,
		});
	}

	/**
	 * Get details about an object
	 */
	async getObject(input: GetObjectParams): Promise<MysObjectResponse> {
		if (!input.id || !isValidMysObjectId(normalizeMysObjectId(input.id))) {
			throw new Error('Invalid Mys Object id');
		}
		return await this.transport.request({
			method: 'mys_getObject',
			params: [input.id, input.options],
			signal: input.signal,
		});
	}

	async tryGetPastObject(input: TryGetPastObjectParams): Promise<ObjectRead> {
		return await this.transport.request({
			method: 'mys_tryGetPastObject',
			params: [input.id, input.version, input.options],
			signal: input.signal,
		});
	}

	/**
	 * Batch get details about a list of objects. If any of the object ids are duplicates the call will fail
	 */
	async multiGetObjects(input: MultiGetObjectsParams): Promise<MysObjectResponse[]> {
		input.ids.forEach((id) => {
			if (!id || !isValidMysObjectId(normalizeMysObjectId(id))) {
				throw new Error(`Invalid Mys Object id ${id}`);
			}
		});
		const hasDuplicates = input.ids.length !== new Set(input.ids).size;
		if (hasDuplicates) {
			throw new Error(`Duplicate object ids in batch call ${input.ids}`);
		}

		return await this.transport.request({
			method: 'mys_multiGetObjects',
			params: [input.ids, input.options],
			signal: input.signal,
		});
	}

	/**
	 * Get transaction blocks for a given query criteria
	 */
	async queryTransactionBlocks(
		input: QueryTransactionBlocksParams,
	): Promise<PaginatedTransactionResponse> {
		return await this.transport.request({
			method: 'mysx_queryTransactionBlocks',
			params: [
				{
					filter: input.filter,
					options: input.options,
				} as MysTransactionBlockResponseQuery,
				input.cursor,
				input.limit,
				(input.order || 'descending') === 'descending',
			],
			signal: input.signal,
		});
	}

	async getTransactionBlock(
		input: GetTransactionBlockParams,
	): Promise<MysTransactionBlockResponse> {
		if (!isValidTransactionDigest(input.digest)) {
			throw new Error('Invalid Transaction digest');
		}
		return await this.transport.request({
			method: 'mys_getTransactionBlock',
			params: [input.digest, input.options],
			signal: input.signal,
		});
	}

	async multiGetTransactionBlocks(
		input: MultiGetTransactionBlocksParams,
	): Promise<MysTransactionBlockResponse[]> {
		input.digests.forEach((d) => {
			if (!isValidTransactionDigest(d)) {
				throw new Error(`Invalid Transaction digest ${d}`);
			}
		});

		const hasDuplicates = input.digests.length !== new Set(input.digests).size;
		if (hasDuplicates) {
			throw new Error(`Duplicate digests in batch call ${input.digests}`);
		}

		return await this.transport.request({
			method: 'mys_multiGetTransactionBlocks',
			params: [input.digests, input.options],
			signal: input.signal,
		});
	}

	async executeTransactionBlock({
		transactionBlock,
		signature,
		options,
		requestType,
		signal,
	}: ExecuteTransactionBlockParams): Promise<MysTransactionBlockResponse> {
		const result: MysTransactionBlockResponse = await this.transport.request({
			method: 'mys_executeTransactionBlock',
			params: [
				typeof transactionBlock === 'string' ? transactionBlock : toBase64(transactionBlock),
				Array.isArray(signature) ? signature : [signature],
				options,
			],
			signal,
		});

		if (requestType === 'WaitForLocalExecution') {
			try {
				await this.waitForTransaction({
					digest: result.digest,
				});
			} catch (_) {
				// Ignore error while waiting for transaction
			}
		}

		return result;
	}

	async signAndExecuteTransaction({
		transaction,
		signer,
		...input
	}: {
		transaction: Uint8Array | Transaction;
		signer: Signer;
	} & Omit<
		ExecuteTransactionBlockParams,
		'transactionBlock' | 'signature'
	>): Promise<MysTransactionBlockResponse> {
		let transactionBytes;

		if (transaction instanceof Uint8Array) {
			transactionBytes = transaction;
		} else {
			transaction.setSenderIfNotSet(signer.toMysAddress());
			transactionBytes = await transaction.build({ client: this });
		}

		const { signature, bytes } = await signer.signTransaction(transactionBytes);

		return this.executeTransactionBlock({
			transactionBlock: bytes,
			signature,
			...input,
		});
	}

	/**
	 * Get total number of transactions
	 */

	async getTotalTransactionBlocks({ signal }: { signal?: AbortSignal } = {}): Promise<bigint> {
		const resp = await this.transport.request<string>({
			method: 'mys_getTotalTransactionBlocks',
			params: [],
			signal,
		});
		return BigInt(resp);
	}

	/**
	 * Getting the reference gas price for the network
	 */
	async getReferenceGasPrice({ signal }: GetReferenceGasPriceParams = {}): Promise<bigint> {
		const resp = await this.transport.request<string>({
			method: 'mysx_getReferenceGasPrice',
			params: [],
			signal,
		});
		return BigInt(resp);
	}

	/**
	 * Return the delegated stakes for an address
	 */
	async getStakes(input: GetStakesParams): Promise<DelegatedStake[]> {
		if (!input.owner || !isValidMysAddress(normalizeMysAddress(input.owner))) {
			throw new Error('Invalid Mys address');
		}
		return await this.transport.request({
			method: 'mysx_getStakes',
			params: [input.owner],
			signal: input.signal,
		});
	}

	/**
	 * Return the delegated stakes queried by id.
	 */
	async getStakesByIds(input: GetStakesByIdsParams): Promise<DelegatedStake[]> {
		input.stakedMysIds.forEach((id) => {
			if (!id || !isValidMysObjectId(normalizeMysObjectId(id))) {
				throw new Error(`Invalid Mys Stake id ${id}`);
			}
		});
		return await this.transport.request({
			method: 'mysx_getStakesByIds',
			params: [input.stakedMysIds],
			signal: input.signal,
		});
	}

	/**
	 * Return the latest system state content.
	 */
	async getLatestMysSystemState({
		signal,
	}: GetLatestMysSystemStateParams = {}): Promise<MysSystemStateSummary> {
		return await this.transport.request({
			method: 'mysx_getLatestMysSystemState',
			params: [],
			signal,
		});
	}

	/**
	 * Get events for a given query criteria
	 */
	async queryEvents(input: QueryEventsParams): Promise<PaginatedEvents> {
		return await this.transport.request({
			method: 'mysx_queryEvents',
			params: [
				input.query,
				input.cursor,
				input.limit,
				(input.order || 'descending') === 'descending',
			],
			signal: input.signal,
		});
	}

	/**
	 * Subscribe to get notifications whenever an event matching the filter occurs
	 *
	 * @deprecated
	 */
	async subscribeEvent(
		input: SubscribeEventParams & {
			/** function to run when we receive a notification of a new event matching the filter */
			onMessage: (event: MysEvent) => void;
		},
	): Promise<Unsubscribe> {
		return this.transport.subscribe({
			method: 'mysx_subscribeEvent',
			unsubscribe: 'mysx_unsubscribeEvent',
			params: [input.filter],
			onMessage: input.onMessage,
			signal: input.signal,
		});
	}

	/**
	 * @deprecated
	 */
	async subscribeTransaction(
		input: SubscribeTransactionParams & {
			/** function to run when we receive a notification of a new event matching the filter */
			onMessage: (event: TransactionEffects) => void;
		},
	): Promise<Unsubscribe> {
		return this.transport.subscribe({
			method: 'mysx_subscribeTransaction',
			unsubscribe: 'mysx_unsubscribeTransaction',
			params: [input.filter],
			onMessage: input.onMessage,
			signal: input.signal,
		});
	}

	/**
	 * Runs the transaction block in dev-inspect mode. Which allows for nearly any
	 * transaction (or Move call) with any arguments. Detailed results are
	 * provided, including both the transaction effects and any return values.
	 */
	async devInspectTransactionBlock(
		input: DevInspectTransactionBlockParams,
	): Promise<DevInspectResults> {
		let devInspectTxBytes;
		if (isTransaction(input.transactionBlock)) {
			input.transactionBlock.setSenderIfNotSet(input.sender);
			devInspectTxBytes = toBase64(
				await input.transactionBlock.build({
					client: this,
					onlyTransactionKind: true,
				}),
			);
		} else if (typeof input.transactionBlock === 'string') {
			devInspectTxBytes = input.transactionBlock;
		} else if (input.transactionBlock instanceof Uint8Array) {
			devInspectTxBytes = toBase64(input.transactionBlock);
		} else {
			throw new Error('Unknown transaction block format.');
		}

		input.signal?.throwIfAborted();

		return await this.transport.request({
			method: 'mys_devInspectTransactionBlock',
			params: [input.sender, devInspectTxBytes, input.gasPrice?.toString(), input.epoch],
			signal: input.signal,
		});
	}

	/**
	 * Dry run a transaction block and return the result.
	 */
	async dryRunTransactionBlock(
		input: DryRunTransactionBlockParams,
	): Promise<DryRunTransactionBlockResponse> {
		return await this.transport.request({
			method: 'mys_dryRunTransactionBlock',
			params: [
				typeof input.transactionBlock === 'string'
					? input.transactionBlock
					: toBase64(input.transactionBlock),
			],
		});
	}

	/**
	 * Return the list of dynamic field objects owned by an object
	 */
	async getDynamicFields(input: GetDynamicFieldsParams): Promise<DynamicFieldPage> {
		if (!input.parentId || !isValidMysObjectId(normalizeMysObjectId(input.parentId))) {
			throw new Error('Invalid Mys Object id');
		}
		return await this.transport.request({
			method: 'mysx_getDynamicFields',
			params: [input.parentId, input.cursor, input.limit],
			signal: input.signal,
		});
	}

	/**
	 * Return the dynamic field object information for a specified object
	 */
	async getDynamicFieldObject(input: GetDynamicFieldObjectParams): Promise<MysObjectResponse> {
		return await this.transport.request({
			method: 'mysx_getDynamicFieldObject',
			params: [input.parentId, input.name],
			signal: input.signal,
		});
	}

	/**
	 * Get the sequence number of the latest checkpoint that has been executed
	 */
	async getLatestCheckpointSequenceNumber({
		signal,
	}: GetLatestCheckpointSequenceNumberParams = {}): Promise<string> {
		const resp = await this.transport.request({
			method: 'mys_getLatestCheckpointSequenceNumber',
			params: [],
			signal,
		});
		return String(resp);
	}

	/**
	 * Returns information about a given checkpoint
	 */
	async getCheckpoint(input: GetCheckpointParams): Promise<Checkpoint> {
		return await this.transport.request({
			method: 'mys_getCheckpoint',
			params: [input.id],
			signal: input.signal,
		});
	}

	/**
	 * Returns historical checkpoints paginated
	 */
	async getCheckpoints(
		input: PaginationArguments<CheckpointPage['nextCursor']> & GetCheckpointsParams,
	): Promise<CheckpointPage> {
		return await this.transport.request({
			method: 'mys_getCheckpoints',
			params: [input.cursor, input?.limit, input.descendingOrder],
			signal: input.signal,
		});
	}

	/**
	 * Return the committee information for the asked epoch
	 */
	async getCommitteeInfo(input?: GetCommitteeInfoParams): Promise<CommitteeInfo> {
		return await this.transport.request({
			method: 'mysx_getCommitteeInfo',
			params: [input?.epoch],
			signal: input?.signal,
		});
	}

	async getNetworkMetrics({ signal }: { signal?: AbortSignal } = {}): Promise<NetworkMetrics> {
		return await this.transport.request({
			method: 'mysx_getNetworkMetrics',
			params: [],
			signal,
		});
	}

	async getAddressMetrics({ signal }: { signal?: AbortSignal } = {}): Promise<AddressMetrics> {
		return await this.transport.request({
			method: 'mysx_getLatestAddressMetrics',
			params: [],
			signal,
		});
	}

	async getEpochMetrics(
		input?: {
			descendingOrder?: boolean;
			signal?: AbortSignal;
		} & PaginationArguments<EpochMetricsPage['nextCursor']>,
	): Promise<EpochMetricsPage> {
		return await this.transport.request({
			method: 'mysx_getEpochMetrics',
			params: [input?.cursor, input?.limit, input?.descendingOrder],
			signal: input?.signal,
		});
	}

	async getAllEpochAddressMetrics(input?: {
		descendingOrder?: boolean;
		signal?: AbortSignal;
	}): Promise<AllEpochsAddressMetrics> {
		return await this.transport.request({
			method: 'mysx_getAllEpochAddressMetrics',
			params: [input?.descendingOrder],
			signal: input?.signal,
		});
	}

	/**
	 * Return the committee information for the asked epoch
	 */
	async getEpochs(
		input?: {
			descendingOrder?: boolean;
			signal?: AbortSignal;
		} & PaginationArguments<EpochPage['nextCursor']>,
	): Promise<EpochPage> {
		return await this.transport.request({
			method: 'mysx_getEpochs',
			params: [input?.cursor, input?.limit, input?.descendingOrder],
			signal: input?.signal,
		});
	}

	/**
	 * Returns list of top move calls by usage
	 */
	async getMoveCallMetrics({ signal }: { signal?: AbortSignal } = {}): Promise<MoveCallMetrics> {
		return await this.transport.request({
			method: 'mysx_getMoveCallMetrics',
			params: [],
			signal,
		});
	}

	/**
	 * Return the committee information for the asked epoch
	 */
	async getCurrentEpoch({ signal }: { signal?: AbortSignal } = {}): Promise<EpochInfo> {
		return await this.transport.request({
			method: 'mysx_getCurrentEpoch',
			params: [],
			signal,
		});
	}

	/**
	 * Return the Validators APYs
	 */
	async getValidatorsApy({ signal }: { signal?: AbortSignal } = {}): Promise<ValidatorsApy> {
		return await this.transport.request({
			method: 'mysx_getValidatorsApy',
			params: [],
			signal,
		});
	}

	// TODO: Migrate this to `mys_getChainIdentifier` once it is widely available.
	async getChainIdentifier({ signal }: { signal?: AbortSignal } = {}): Promise<string> {
		const checkpoint = await this.getCheckpoint({ id: '0', signal });
		const bytes = fromBase58(checkpoint.digest);
		return toHex(bytes.slice(0, 4));
	}

	async resolveNameServiceAddress(input: ResolveNameServiceAddressParams): Promise<string | null> {
		return await this.transport.request({
			method: 'mysx_resolveNameServiceAddress',
			params: [input.name],
			signal: input.signal,
		});
	}

	async resolveNameServiceNames({
		format = 'dot',
		...input
	}: ResolveNameServiceNamesParams & {
		format?: 'at' | 'dot';
	}): Promise<ResolvedNameServiceNames> {
		const { nextCursor, hasNextPage, data }: ResolvedNameServiceNames =
			await this.transport.request({
				method: 'mysx_resolveNameServiceNames',
				params: [input.address, input.cursor, input.limit],
				signal: input.signal,
			});

		return {
			hasNextPage,
			nextCursor,
			data: data.map((name) => normalizeMysNSName(name, format)),
		};
	}

	async getProtocolConfig(input?: GetProtocolConfigParams): Promise<ProtocolConfig> {
		return await this.transport.request({
			method: 'mys_getProtocolConfig',
			params: [input?.version],
			signal: input?.signal,
		});
	}

	async verifyZkLoginSignature(input: VerifyZkLoginSignatureParams): Promise<ZkLoginVerifyResult> {
		return await this.transport.request({
			method: 'mys_verifyZkLoginSignature',
			params: [input.bytes, input.signature, input.intentScope, input.author],
			signal: input.signal,
		});
	}

	/**
	 * Wait for a transaction block result to be available over the API.
	 * This can be used in conjunction with `executeTransactionBlock` to wait for the transaction to
	 * be available via the API.
	 * This currently polls the `getTransactionBlock` API to check for the transaction.
	 */
	async waitForTransaction({
		signal,
		timeout = 60 * 1000,
		pollInterval = 2 * 1000,
		...input
	}: {
		/** An optional abort signal that can be used to cancel */
		signal?: AbortSignal;
		/** The amount of time to wait for a transaction block. Defaults to one minute. */
		timeout?: number;
		/** The amount of time to wait between checks for the transaction block. Defaults to 2 seconds. */
		pollInterval?: number;
	} & Parameters<MysClient['getTransactionBlock']>[0]): Promise<MysTransactionBlockResponse> {
		const timeoutSignal = AbortSignal.timeout(timeout);
		const timeoutPromise = new Promise((_, reject) => {
			timeoutSignal.addEventListener('abort', () => reject(timeoutSignal.reason));
		});

		timeoutPromise.catch(() => {
			// Swallow unhandled rejections that might be thrown after early return
		});

		while (!timeoutSignal.aborted) {
			signal?.throwIfAborted();
			try {
				return await this.getTransactionBlock(input);
			} catch (e) {
				// Wait for either the next poll interval, or the timeout.
				await Promise.race([
					new Promise((resolve) => setTimeout(resolve, pollInterval)),
					timeoutPromise,
				]);
			}
		}

		timeoutSignal.throwIfAborted();

		// This should never happen, because the above case should always throw, but just adding it in the event that something goes horribly wrong.
		throw new Error('Unexpected error while waiting for transaction block.');
	}

	experimental_asClientExtension(this: MysClient) {
		return {
			name: 'jsonRPC',
			register: () => {
				return this;
			},
		} as const;
	}
}
