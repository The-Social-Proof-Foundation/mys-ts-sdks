// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { getFullnodeUrl, isMysClient, MysClient } from '@socialproof/mys/client';
import type { MysClientOptions } from '@socialproof/mys/client';
import { createContext, useMemo, useState } from 'react';

import type { NetworkConfig } from '../hooks/networkConfig.js';

type NetworkConfigs<T extends NetworkConfig | MysClient = NetworkConfig | MysClient> = Record<
	string,
	T
>;

export interface MysClientProviderContext {
	client: MysClient;
	networks: NetworkConfigs;
	network: string;
	config: NetworkConfig | null;
	selectNetwork: (network: string) => void;
}

export const MysClientContext = createContext<MysClientProviderContext | null>(null);

export type MysClientProviderProps<T extends NetworkConfigs> = {
	createClient?: (name: keyof T, config: T[keyof T]) => MysClient;
	children: React.ReactNode;
	networks?: T;
	onNetworkChange?: (network: keyof T & string) => void;
} & (
	| {
			defaultNetwork?: keyof T & string;
			network?: never;
	  }
	| {
			defaultNetwork?: never;
			network?: keyof T & string;
	  }
);

const DEFAULT_NETWORKS = {
	localnet: { url: getFullnodeUrl('localnet') },
};

const DEFAULT_CREATE_CLIENT = function createClient(
	_name: string,
	config: NetworkConfig | MysClient,
) {
	if (isMysClient(config)) {
		return config;
	}

	return new MysClient(config);
};

export function MysClientProvider<T extends NetworkConfigs>(props: MysClientProviderProps<T>) {
	const { onNetworkChange, network, children } = props;
	const networks = (props.networks ?? DEFAULT_NETWORKS) as T;
	const createClient =
		(props.createClient as typeof DEFAULT_CREATE_CLIENT) ?? DEFAULT_CREATE_CLIENT;

	const [selectedNetwork, setSelectedNetwork] = useState<keyof T & string>(
		props.network ?? props.defaultNetwork ?? (Object.keys(networks)[0] as keyof T & string),
	);

	const currentNetwork = props.network ?? selectedNetwork;

	const client = useMemo(() => {
		return createClient(currentNetwork, networks[currentNetwork]);
	}, [createClient, currentNetwork, networks]);

	const ctx = useMemo((): MysClientProviderContext => {
		return {
			client,
			networks,
			network: currentNetwork,
			config:
				networks[currentNetwork] instanceof MysClient
					? null
					: (networks[currentNetwork] as MysClientOptions),
			selectNetwork: (newNetwork) => {
				if (currentNetwork === newNetwork) {
					return;
				}

				if (!network && newNetwork !== selectedNetwork) {
					setSelectedNetwork(newNetwork);
				}

				onNetworkChange?.(newNetwork);
			},
		};
	}, [client, networks, selectedNetwork, currentNetwork, network, onNetworkChange]);

	return <MysClientContext.Provider value={ctx}>{children}</MysClientContext.Provider>;
}
