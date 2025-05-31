// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { PACKAGE_VERSION, TARGETED_RPC_VERSION } from '../version.js';
import { JsonRpcError, MysHTTPStatusError } from './errors.js';
import type { WebsocketClientOptions } from './rpc-websocket-client.js';
import { WebsocketClient } from './rpc-websocket-client.js';

/**
 * An object defining headers to be passed to the RPC server
 */
export type HttpHeaders = { [header: string]: string };

export interface MysHTTPTransportOptions {
	fetch?: typeof fetch;
	WebSocketConstructor?: typeof WebSocket;
	url: string;
	rpc?: {
		headers?: HttpHeaders;
		url?: string;
	};
	websocket?: WebsocketClientOptions & {
		url?: string;
	};
}

export interface MysTransportRequestOptions {
	method: string;
	params: unknown[];
	signal?: AbortSignal;
}

// eslint-disable-next-line @typescript-eslint/ban-types

export interface MysTransportSubscribeOptions<T> {
	method: string;
	unsubscribe: string;
	params: unknown[];
	onMessage: (event: T) => void;
	signal?: AbortSignal;
}

export interface MysTransport {
	request<T = unknown>(input: MysTransportRequestOptions): Promise<T>;
	subscribe<T = unknown>(input: MysTransportSubscribeOptions<T>): Promise<() => Promise<boolean>>;
}

export class MysHTTPTransport implements MysTransport {
	#requestId = 0;
	#options: MysHTTPTransportOptions;
	#websocketClient?: WebsocketClient;

	constructor(options: MysHTTPTransportOptions) {
		this.#options = options;
	}

	fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
		const fetchFn = this.#options.fetch ?? fetch;

		if (!fetchFn) {
			throw new Error(
				'The current environment does not support fetch, you can provide a fetch implementation in the options for MysHTTPTransport.',
			);
		}

		return fetchFn(input, init);
	}

	#getWebsocketClient(): WebsocketClient {
		if (!this.#websocketClient) {
			const WebSocketConstructor = this.#options.WebSocketConstructor ?? WebSocket;
			if (!WebSocketConstructor) {
				throw new Error(
					'The current environment does not support WebSocket, you can provide a WebSocketConstructor in the options for MysHTTPTransport.',
				);
			}

			this.#websocketClient = new WebsocketClient(
				this.#options.websocket?.url ?? this.#options.url,
				{
					WebSocketConstructor,
					...this.#options.websocket,
				},
			);
		}

		return this.#websocketClient;
	}

	async request<T>(input: MysTransportRequestOptions): Promise<T> {
		this.#requestId += 1;

		const res = await this.fetch(this.#options.rpc?.url ?? this.#options.url, {
			method: 'POST',
			signal: input.signal,
			headers: {
				'Content-Type': 'application/json',
				'Client-Sdk-Type': 'typescript',
				'Client-Sdk-Version': PACKAGE_VERSION,
				'Client-Target-Api-Version': TARGETED_RPC_VERSION,
				'Client-Request-Method': input.method,
				...this.#options.rpc?.headers,
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: this.#requestId,
				method: input.method,
				params: input.params,
			}),
		});

		if (!res.ok) {
			throw new MysHTTPStatusError(
				`Unexpected status code: ${res.status}`,
				res.status,
				res.statusText,
			);
		}

		const data = await res.json();

		if ('error' in data && data.error != null) {
			throw new JsonRpcError(data.error.message, data.error.code);
		}

		return data.result;
	}

	async subscribe<T>(input: MysTransportSubscribeOptions<T>): Promise<() => Promise<boolean>> {
		const unsubscribe = await this.#getWebsocketClient().subscribe(input);

		if (input.signal) {
			input.signal.throwIfAborted();
			input.signal.addEventListener('abort', () => {
				unsubscribe();
			});
		}

		return async () => !!(await unsubscribe());
	}
}
