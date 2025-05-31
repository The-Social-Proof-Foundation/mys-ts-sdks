// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { BcsType } from '@socialproof/bcs';
import { pureBcsSchemaFromTypeName } from '@socialproof/mys/bcs';
import type { PureTypeName, ShapeFromPureTypeName } from '@socialproof/mys/bcs';
import type { MysObjectData } from '@socialproof/mys/client';
import type {
	Experimental_BaseClient,
	Experimental_MysClientTypes,
} from '@socialproof/mys/experimental';
import { deriveDynamicFieldID } from '@socialproof/mys/utils';
import DataLoader from 'dataloader';

import { Field } from '../contracts/deps/0x0000000000000000000000000000000000000000000000000000000000000002/dynamic_field.js';

export class MysObjectDataLoader extends DataLoader<
	string,
	Experimental_MysClientTypes.ObjectResponse
> {
	#dynamicFieldCache = new Map<string, Map<string, Experimental_MysClientTypes.ObjectResponse>>();
	constructor(mysClient: Experimental_BaseClient) {
		super(async (ids: readonly string[]) => {
			const { objects } = await mysClient.core.getObjects({
				objectIds: ids as string[],
			});

			return objects;
		});
	}

	override async load<T = MysObjectData>(id: string, schema?: BcsType<T, any>): Promise<T> {
		const data = await super.load(id);

		if (schema) {
			return schema.parse(data.content);
		}

		return data as T;
	}

	override async loadMany<T = MysObjectData>(
		ids: string[],
		schema?: BcsType<T, any>,
	): Promise<(T | Error)[]> {
		const data = await super.loadMany(ids);

		if (!schema) {
			return data as (T | Error)[];
		}

		return data.map((d) => {
			if (d instanceof Error) {
				return d;
			}

			return schema.parse(d.content);
		});
	}

	async loadManyOrThrow<T>(ids: string[], schema: BcsType<T, any>): Promise<T[]> {
		const data = await this.loadMany(ids, schema);

		for (const d of data) {
			if (d instanceof Error) {
				throw d;
			}
		}

		return data as T[];
	}

	override clearAll() {
		this.#dynamicFieldCache.clear();
		return super.clearAll();
	}

	override clear(key: string) {
		this.#dynamicFieldCache.delete(key);
		return super.clear(key);
	}

	async loadFieldObject<K extends PureTypeName, T>(
		parent: string,
		name: {
			type: K;
			value: ShapeFromPureTypeName<K>;
		},
		type: BcsType<T, any>,
	): Promise<T> {
		const schema = pureBcsSchemaFromTypeName<K>(name.type as never);
		const id = deriveDynamicFieldID(parent, 'u64', schema.serialize(name.value).toBytes());

		return (await this.load(id, Field(schema, type))).value;
	}
}
