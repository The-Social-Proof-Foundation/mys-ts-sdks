// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { toBase64 } from '@mysten/bcs';
import { bcs } from '@mysten/sui/bcs';
import type { Signer } from '@mysten/sui/cryptography';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { isValidSuiAddress, isValidSuiObjectId } from '@mysten/sui/utils';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import { generateSecretKey, toPublicKey, toVerificationKey } from './elgamal.js';
import {
	ExpiredSessionKeyError,
	InvalidPersonalMessageSignatureError,
	UserError,
} from './error.js';
import type { ZkLoginCompatibleClient } from '@mysten/sui/zklogin';

export const RequestFormat = bcs.struct('RequestFormat', {
	ptb: bcs.vector(bcs.U8),
	encKey: bcs.vector(bcs.U8),
	encVerificationKey: bcs.vector(bcs.U8),
});

export type Certificate = {
	user: string;
	session_vk: string;
	creation_time: number;
	ttl_min: number;
	signature: string;
};

export type SessionKeyType = {
	address: string;
	packageId: string;
	creationTimeMs: number;
	ttlMin: number;
	personalMessageSignature?: string;
	sessionKey: string;
};

export class SessionKey {
	#address: string;
	#packageId: string;
	#creationTimeMs: number;
	#ttlMin: number;
	#sessionKey: Ed25519Keypair;
	#personalMessageSignature?: string;
	#signer?: Signer;
	#suiClient: ZkLoginCompatibleClient;

	constructor({
		address,
		packageId,
		ttlMin,
		signer,
		suiClient,
	}: {
		address: string;
		packageId: string;
		ttlMin: number;
		signer?: Signer;
		suiClient: ZkLoginCompatibleClient;
	}) {
		if (!isValidSuiObjectId(packageId) || !isValidSuiAddress(address)) {
			throw new UserError(`Invalid package ID ${packageId} or address ${address}`);
		}
		if (ttlMin > 30 || ttlMin < 1) {
			throw new UserError(`Invalid TTL ${ttlMin}, must be between 1 and 30`);
		}
		if (signer && signer.getPublicKey().toSuiAddress() !== address) {
			throw new UserError('Signer address does not match session key address');
		}
		// TODO: Verify that the given package is the first version of the package.

		this.#address = address;
		this.#packageId = packageId;
		this.#creationTimeMs = Date.now();
		this.#ttlMin = ttlMin;
		this.#sessionKey = Ed25519Keypair.generate();
		this.#signer = signer;
		this.#suiClient = suiClient;
	}

	isExpired(): boolean {
		// Allow 10 seconds for clock skew
		return this.#creationTimeMs + this.#ttlMin * 60 * 1000 - 10_000 < Date.now();
	}

	getAddress(): string {
		return this.#address;
	}

	getPackageId(): string {
		return this.#packageId;
	}

	getPersonalMessage(): Uint8Array {
		const creationTimeUtc =
			new Date(this.#creationTimeMs).toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
		const message = `Accessing keys of package ${this.#packageId} for ${this.#ttlMin} mins from ${creationTimeUtc}, session key ${toBase64(this.#sessionKey.getPublicKey().toRawBytes())}`;
		return new TextEncoder().encode(message);
	}

	async setPersonalMessageSignature(personalMessageSignature: string) {
		if (!this.#personalMessageSignature) {
			try {
				await verifyPersonalMessageSignature(this.getPersonalMessage(), personalMessageSignature, {
					address: this.#address,
					client: this.#suiClient,
				});
				this.#personalMessageSignature = personalMessageSignature;
			} catch (e) {
				throw new InvalidPersonalMessageSignatureError('Not valid');
			}
		}
	}

	async getCertificate(): Promise<Certificate> {
		if (!this.#personalMessageSignature) {
			if (this.#signer) {
				const { signature } = await this.#signer.signPersonalMessage(this.getPersonalMessage());
				this.#personalMessageSignature = signature;
			} else {
				throw new InvalidPersonalMessageSignatureError('Personal message signature is not set');
			}
		}
		return {
			user: this.#address,
			session_vk: toBase64(this.#sessionKey.getPublicKey().toRawBytes()),
			creation_time: this.#creationTimeMs,
			ttl_min: this.#ttlMin,
			signature: this.#personalMessageSignature,
		};
	}

	async createRequestParams(
		txBytes: Uint8Array,
	): Promise<{ decryptionKey: Uint8Array; requestSignature: string }> {
		if (this.isExpired()) {
			throw new ExpiredSessionKeyError();
		}
		const egSk = generateSecretKey();
		const msgToSign = RequestFormat.serialize({
			ptb: txBytes.slice(1),
			encKey: toPublicKey(egSk),
			encVerificationKey: toVerificationKey(egSk),
		}).toBytes();
		return {
			decryptionKey: egSk,
			requestSignature: toBase64(await this.#sessionKey.sign(msgToSign)),
		};
	}

	/**
	 * Export the Session Key object from the instance. Store the object in IndexedDB to persist.
	 */
	export(): SessionKeyType {
		const obj = {
			address: this.#address,
			packageId: this.#packageId,
			creationTimeMs: this.#creationTimeMs,
			ttlMin: this.#ttlMin,
			personalMessageSignature: this.#personalMessageSignature,
			sessionKey: this.#sessionKey.getSecretKey(), // bech32 encoded string
		};

		Object.defineProperty(obj, 'toJSON', {
			enumerable: false,
			value: () => {
				throw new Error('This object is not serializable');
			},
		});
		return obj;
	}

	/**
	 * Restore a SessionKey instance for the given object.
	 * @returns A new SessionKey instance with restored state
	 */
	static import(
		data: SessionKeyType,
		suiClient: ZkLoginCompatibleClient,
		signer?: Signer,
	): SessionKey {
		const instance = new SessionKey({
			address: data.address,
			packageId: data.packageId,
			ttlMin: data.ttlMin,
			signer,
			suiClient,
		});

		instance.#creationTimeMs = data.creationTimeMs;
		instance.#sessionKey = Ed25519Keypair.fromSecretKey(data.sessionKey);
		instance.#personalMessageSignature = data.personalMessageSignature;

		if (instance.isExpired()) {
			throw new ExpiredSessionKeyError();
		}
		return instance;
	}
}
