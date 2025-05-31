// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/ban-types */

import type { Simplify, UnionToIntersection } from '@socialproof/utils';
import { ClientCache } from './cache.js';
import type { Experimental_CoreClient } from './core.js';
import type {
	ClientWithExtensions,
	Experimental_MysClientTypes,
	MysClientRegistration,
} from './types.js';

export abstract class Experimental_BaseClient {
	network: Experimental_MysClientTypes.Network;
	cache = new ClientCache();

	constructor({ network }: Experimental_MysClientTypes.MysClientOptions) {
		this.network = network;
	}

	abstract core: Experimental_CoreClient;

	$extend<const Registrations extends MysClientRegistration<this>[]>(
		...registrations: Registrations
	) {
		return Object.create(
			this,
			Object.fromEntries(
				registrations.map((registration) => {
					if ('experimental_asClientExtension' in registration) {
						const { name, register } = registration.experimental_asClientExtension();
						return [name, { value: register(this) }];
					}
					return [registration.name, { value: registration.register(this) }];
				}),
			),
		) as ClientWithExtensions<
			Simplify<
				UnionToIntersection<
					{
						[K in keyof Registrations]: Registrations[K] extends MysClientRegistration<
							this,
							infer Name extends string,
							infer Extension
						>
							? {
									[K2 in Name]: Extension;
								}
							: never;
					}[number]
				>
			>,
			this
		>;
	}
}
