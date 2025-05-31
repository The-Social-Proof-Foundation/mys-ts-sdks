// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { WalletAccount } from '@wallet-standard/core';

/**
 * Name of the feature.
 * @deprecated Wallets can still implement this method for compatibility, but this has been replaced by the `mys:signPersonalMessage` feature
 **/
export const MysSignMessage = 'mys:signMessage';

/**
 * The latest API version of the signMessage API.
 * @deprecated Wallets can still implement this method for compatibility, but this has been replaced by the `mys:signPersonalMessage` feature
 */
export type MysSignMessageVersion = '1.0.0';

/**
 * A Wallet Standard feature for signing a personal message, and returning the
 * message bytes that were signed, and message signature.
 *
 * @deprecated Wallets can still implement this method for compatibility, but this has been replaced by the `mys:signPersonalMessage` feature
 */
export type MysSignMessageFeature = {
	/** Namespace for the feature. */
	[MysSignMessage]: {
		/** Version of the feature API. */
		version: MysSignMessageVersion;
		signMessage: MysSignMessageMethod;
	};
};

/** @deprecated Wallets can still implement this method for compatibility, but this has been replaced by the `mys:signPersonalMessage` feature */
export type MysSignMessageMethod = (input: MysSignMessageInput) => Promise<MysSignMessageOutput>;

/**
 * Input for signing messages.
 * @deprecated Wallets can still implement this method for compatibility, but this has been replaced by the `mys:signPersonalMessage` feature
 */
export interface MysSignMessageInput {
	message: Uint8Array;
	account: WalletAccount;
}

/**
 * Output of signing messages.
 * @deprecated Wallets can still implement this method for compatibility, but this has been replaced by the `mys:signPersonalMessage` feature
 */
export interface MysSignMessageOutput {
	/** Base64 message bytes. */
	messageBytes: string;
	/** Base64 encoded signature */
	signature: string;
}
