// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs, toBase64 } from '@socialproof/bcs';
import { blake2b } from '@noble/hashes/blake2b';
import { bech32 } from '@scure/base';

import type { IntentScope } from './intent.js';
import { messageWithIntent } from './intent.js';
import type { PublicKey } from './publickey.js';
import { SIGNATURE_FLAG_TO_SCHEME, SIGNATURE_SCHEME_TO_FLAG } from './signature-scheme.js';
import type { SignatureScheme } from './signature-scheme.js';
import { toSerializedSignature } from './signature.js';
import type { Transaction } from '../transactions/Transaction.js';
import type { ClientWithCoreApi, Experimental_MysClientTypes } from '../experimental/index.js';

export const PRIVATE_KEY_SIZE = 32;
export const LEGACY_PRIVATE_KEY_SIZE = 64;
export const MYS_PRIVATE_KEY_PREFIX = 'mysprivkey';

export type ParsedKeypair = {
	scheme: SignatureScheme;
	/** @deprecated use `scheme` instead */
	schema: SignatureScheme;
	secretKey: Uint8Array;
};

export interface SignatureWithBytes {
	bytes: string;
	signature: string;
}

export interface SignAndExecuteOptions {
	transaction: Transaction;
	client: ClientWithCoreApi;
}

/**
 * TODO: Document
 */
export abstract class Signer {
	abstract sign(bytes: Uint8Array): Promise<Uint8Array>;
	/**
	 * Sign messages with a specific intent. By combining the message bytes with the intent before hashing and signing,
	 * it ensures that a signed message is tied to a specific purpose and domain separator is provided
	 */
	async signWithIntent(bytes: Uint8Array, intent: IntentScope): Promise<SignatureWithBytes> {
		const intentMessage = messageWithIntent(intent, bytes);
		const digest = blake2b(intentMessage, { dkLen: 32 });

		const signature = toSerializedSignature({
			signature: await this.sign(digest),
			signatureScheme: this.getKeyScheme(),
			publicKey: this.getPublicKey(),
		});

		return {
			signature,
			bytes: toBase64(bytes),
		};
	}
	/**
	 * Signs provided transaction by calling `signWithIntent()` with a `TransactionData` provided as intent scope
	 */
	async signTransaction(bytes: Uint8Array) {
		return this.signWithIntent(bytes, 'TransactionData');
	}
	/**
	 * Signs provided personal message by calling `signWithIntent()` with a `PersonalMessage` provided as intent scope
	 */
	async signPersonalMessage(bytes: Uint8Array) {
		const { signature } = await this.signWithIntent(
			bcs.vector(bcs.u8()).serialize(bytes).toBytes(),
			'PersonalMessage',
		);

		return {
			bytes: toBase64(bytes),
			signature,
		};
	}

	async signAndExecuteTransaction({
		transaction,
		client,
	}: SignAndExecuteOptions): Promise<Experimental_MysClientTypes.TransactionResponse> {
		const bytes = await transaction.build({ client });
		const { signature } = await this.signTransaction(bytes);
		const response = await client.core.executeTransaction({
			transaction: bytes,
			signatures: [signature],
		});

		return response.transaction;
	}

	toMysAddress(): string {
		return this.getPublicKey().toMysAddress();
	}

	/**
	 * Get the key scheme of the keypair: Secp256k1 or ED25519
	 */
	abstract getKeyScheme(): SignatureScheme;

	/**
	 * The public key for this keypair
	 */
	abstract getPublicKey(): PublicKey;
}

export abstract class Keypair extends Signer {
	/**
	 * This returns the Bech32 secret key string for this keypair.
	 */
	abstract getSecretKey(): string;
}

/**
 * This returns an ParsedKeypair object based by validating the
 * 33-byte Bech32 encoded string starting with `mysprivkey`, and
 * parse out the signature scheme and the private key in bytes.
 */
export function decodeMysPrivateKey(value: string): ParsedKeypair {
	const { prefix, words } = bech32.decode(value as `${string}1${string}`);
	if (prefix !== MYS_PRIVATE_KEY_PREFIX) {
		throw new Error('invalid private key prefix');
	}
	const extendedSecretKey = new Uint8Array(bech32.fromWords(words));
	const secretKey = extendedSecretKey.slice(1);
	const signatureScheme =
		SIGNATURE_FLAG_TO_SCHEME[extendedSecretKey[0] as keyof typeof SIGNATURE_FLAG_TO_SCHEME];

	return {
		scheme: signatureScheme,
		schema: signatureScheme,
		secretKey: secretKey,
	};
}

/**
 * This returns a Bech32 encoded string starting with `mysprivkey`,
 * encoding 33-byte `flag || bytes` for the given the 32-byte private
 * key and its signature scheme.
 */
export function encodeMysPrivateKey(bytes: Uint8Array, scheme: SignatureScheme): string {
	if (bytes.length !== PRIVATE_KEY_SIZE) {
		throw new Error('Invalid bytes length');
	}
	const flag = SIGNATURE_SCHEME_TO_FLAG[scheme];
	const privKeyBytes = new Uint8Array(bytes.length + 1);
	privKeyBytes.set([flag]);
	privKeyBytes.set(bytes, 1);
	return bech32.encode(MYS_PRIVATE_KEY_PREFIX, bech32.toWords(privKeyBytes));
}
