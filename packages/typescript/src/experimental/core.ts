// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { TypeTagSerializer } from '../bcs/type-tag-serializer.js';
import type { TransactionPlugin } from '../transactions/index.js';
import { deriveDynamicFieldID } from '../utils/dynamic-fields.js';
import { normalizeStructTag, parseStructTag, MYS_ADDRESS_LENGTH } from '../utils/mys-types.js';
import { Experimental_BaseClient } from './client.js';
import type { ClientWithExtensions, Experimental_MysClientTypes } from './types.js';

export type ClientWithCoreApi = ClientWithExtensions<{
	core: Experimental_CoreClient;
}>;

export abstract class Experimental_CoreClient
	extends Experimental_BaseClient
	implements Experimental_MysClientTypes.TransportMethods
{
	core = this;

	abstract getObjects(
		options: Experimental_MysClientTypes.GetObjectsOptions,
	): Promise<Experimental_MysClientTypes.GetObjectsResponse>;

	async getObject(
		options: Experimental_MysClientTypes.GetObjectOptions,
	): Promise<Experimental_MysClientTypes.GetObjectResponse> {
		const { objectId } = options;
		const {
			objects: [result],
		} = await this.getObjects({ objectIds: [objectId], signal: options.signal });
		if (result instanceof Error) {
			throw result;
		}
		return { object: result };
	}

	abstract getCoins(
		options: Experimental_MysClientTypes.GetCoinsOptions,
	): Promise<Experimental_MysClientTypes.GetCoinsResponse>;

	abstract getOwnedObjects(
		options: Experimental_MysClientTypes.GetOwnedObjectsOptions,
	): Promise<Experimental_MysClientTypes.GetOwnedObjectsResponse>;

	abstract getBalance(
		options: Experimental_MysClientTypes.GetBalanceOptions,
	): Promise<Experimental_MysClientTypes.GetBalanceResponse>;

	abstract getAllBalances(
		options: Experimental_MysClientTypes.GetAllBalancesOptions,
	): Promise<Experimental_MysClientTypes.GetAllBalancesResponse>;

	abstract getTransaction(
		options: Experimental_MysClientTypes.GetTransactionOptions,
	): Promise<Experimental_MysClientTypes.GetTransactionResponse>;

	abstract executeTransaction(
		options: Experimental_MysClientTypes.ExecuteTransactionOptions,
	): Promise<Experimental_MysClientTypes.ExecuteTransactionResponse>;

	abstract dryRunTransaction(
		options: Experimental_MysClientTypes.DryRunTransactionOptions,
	): Promise<Experimental_MysClientTypes.DryRunTransactionResponse>;

	abstract getReferenceGasPrice(
		options?: Experimental_MysClientTypes.GetReferenceGasPriceOptions,
	): Promise<Experimental_MysClientTypes.GetReferenceGasPriceResponse>;

	abstract getDynamicFields(
		options: Experimental_MysClientTypes.GetDynamicFieldsOptions,
	): Promise<Experimental_MysClientTypes.GetDynamicFieldsResponse>;

	abstract resolveTransactionPlugin(): TransactionPlugin;

	async getDynamicField(
		options: Experimental_MysClientTypes.GetDynamicFieldOptions,
	): Promise<Experimental_MysClientTypes.GetDynamicFieldResponse> {
		const fieldId = deriveDynamicFieldID(
			options.parentId,
			TypeTagSerializer.parseFromStr(options.name.type),
			options.name.bcs,
		);
		const {
			objects: [fieldObject],
		} = await this.getObjects({
			objectIds: [fieldId],
			signal: options.signal,
		});

		if (fieldObject instanceof Error) {
			throw fieldObject;
		}

		const fieldType = parseStructTag(fieldObject.type);

		return {
			dynamicField: {
				id: fieldObject.id,
				digest: fieldObject.digest,
				version: fieldObject.version,
				type: fieldObject.type,
				name: {
					type:
						typeof fieldType.typeParams[0] === 'string'
							? fieldType.typeParams[0]
							: normalizeStructTag(fieldType.typeParams[0]),
					bcs: options.name.bcs,
				},
				value: {
					type:
						typeof fieldType.typeParams[1] === 'string'
							? fieldType.typeParams[1]
							: normalizeStructTag(fieldType.typeParams[1]),
					bcs: fieldObject.content.slice(MYS_ADDRESS_LENGTH + options.name.bcs.length),
				},
			},
		};
	}

	async waitForTransaction({
		signal,
		timeout = 60 * 1000,
		...input
	}: {
		/** An optional abort signal that can be used to cancel the wait. */
		signal?: AbortSignal;
		/** The amount of time to wait for transaction. Defaults to one minute. */
		timeout?: number;
	} & Experimental_MysClientTypes.GetTransactionOptions): Promise<Experimental_MysClientTypes.GetTransactionResponse> {
		const abortSignal = signal
			? AbortSignal.any([AbortSignal.timeout(timeout), signal])
			: AbortSignal.timeout(timeout);

		const abortPromise = new Promise((_, reject) => {
			abortSignal.addEventListener('abort', () => reject(abortSignal.reason));
		});

		abortPromise.catch(() => {
			// Swallow unhandled rejections that might be thrown after early return
		});

		// eslint-disable-next-line no-constant-condition
		while (true) {
			abortSignal.throwIfAborted();
			try {
				return await this.getTransaction({
					...input,
					signal: abortSignal,
				});
			} catch (e) {
				await Promise.race([new Promise((resolve) => setTimeout(resolve, 2_000)), abortPromise]);
			}
		}
	}
}
