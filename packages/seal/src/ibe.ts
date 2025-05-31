// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { fromHex } from '@mysten/bcs';

import type { IBEEncryptions } from './bcs.js';
import type { G1Element, GTElement } from './bls12381.js';
import { G2Element, Scalar } from './bls12381.js';
import { deriveKey, hashToG1, kdf, KeyPurpose } from './kdf.js';
import type { KeyServer } from './key-server.js';
import { xor } from './utils.js';

/**
 * The domain separation tag for the signing proof of possession.
 */
export const DST_POP: Uint8Array = new TextEncoder().encode('SUI-SEAL-IBE-BLS12381-POP-00');

/**
 * The interface for the key servers.
 */
export abstract class IBEServers {
	objectIds: string[];

	constructor(objectIds: string[]) {
		this.objectIds = objectIds;
	}

	/**
	 * The number of key servers.
	 */
	size(): number {
		return this.objectIds.length;
	}

	/**
	 * Encrypt a batch of messages for the given identity.
	 *
	 * @param id The identity.
	 * @param msgAndIndices The messages and the corresponding indices of the share being encrypted.
	 * @returns The encrypted messages.
	 */
	abstract encryptBatched(
		id: Uint8Array,
		msgAndIndices: { msg: Uint8Array; index: number }[],
		baseKey: Uint8Array,
		threshold: number,
	): typeof IBEEncryptions.$inferType;
}

/**
 * Identity-based encryption based on the Boneh-Franklin IBE scheme (https://eprint.iacr.org/2001/090).
 * Note that this implementation is of the "BasicIdent" protocol which on its own is not CCA secure, so this IBE implementation should not be used on its own.
 *
 * This object represents a set of key servers that can be used to encrypt messages for a given identity.
 */
export class BonehFranklinBLS12381Services extends IBEServers {
	readonly publicKeys: G2Element[];

	constructor(services: KeyServer[]) {
		super(services.map((service) => service.objectId));
		this.publicKeys = services.map((service) => G2Element.fromBytes(service.pk));
	}

	encryptBatched(
		id: Uint8Array,
		msgAndIndices: { msg: Uint8Array; index: number }[],
		baseKey: Uint8Array,
		threshold: number,
	): typeof IBEEncryptions.$inferType {
		if (this.publicKeys.length === 0 || this.publicKeys.length !== msgAndIndices.length) {
			throw new Error('Invalid public keys');
		}
		const [r, nonce, keys] = encapBatched(this.publicKeys, id);
		const encryptedShares = msgAndIndices.map(({ msg, index }, i) =>
			xor(msg, kdf(keys[i], nonce, id, this.objectIds[i], index)),
		);
		const randomnessKey = deriveKey(
			KeyPurpose.EncryptedRandomness,
			baseKey,
			encryptedShares,
			threshold,
			this.objectIds,
		);
		const encryptedRandomness = xor(randomnessKey, r.toBytes());

		return {
			BonehFranklinBLS12381: {
				nonce: nonce.toBytes(),
				encryptedShares,
				encryptedRandomness,
			},
			$kind: 'BonehFranklinBLS12381',
		};
	}

	/**
	 * Returns true if the user secret key is valid for the given public key and id.
	 * @param user_secret_key - The user secret key.
	 * @param id - The identity.
	 * @param public_key - The public key.
	 * @returns True if the user secret key is valid for the given public key and id.
	 */
	static verifyUserSecretKey(userSecretKey: G1Element, id: string, publicKey: G2Element): boolean {
		const lhs = userSecretKey.pairing(G2Element.generator());
		const rhs = hashToG1(fromHex(id)).pairing(publicKey);
		return lhs.equals(rhs);
	}

	/**
	 * Identity-based decryption.
	 *
	 * @param nonce The encryption nonce.
	 * @param sk The user secret key.
	 * @param ciphertext The encrypted message.
	 * @param info An info parameter also included in the KDF.
	 * @returns The decrypted message.
	 */
	static decrypt(
		nonce: G2Element,
		sk: G1Element,
		ciphertext: Uint8Array,
		id: Uint8Array,
		[objectId, index]: [string, number],
	): Uint8Array {
		return xor(ciphertext, kdf(decap(nonce, sk), nonce, id, objectId, index));
	}
}

/**
 * Batched identity-based key-encapsulation mechanism: encapsulate multiple keys for given identity using different key servers.
 *
 * @param publicKeys Public keys for a set of key servers.
 * @param id The identity used to encapsulate the keys.
 * @returns A common nonce of the keys and a list of keys, 32 bytes each.
 */
function encapBatched(publicKeys: G2Element[], id: Uint8Array): [Scalar, G2Element, GTElement[]] {
	if (publicKeys.length === 0) {
		throw new Error('No public keys provided');
	}
	const r = Scalar.random();
	const nonce = G2Element.generator().multiply(r);
	const gid = hashToG1(id).multiply(r);
	return [r, nonce, publicKeys.map((public_key) => gid.pairing(public_key))];
}

/**
 * Decapsulate a key using a user secret key and the nonce.
 *
 * @param usk The user secret key.
 * @param nonce The nonce.
 * @returns The encapsulated key.
 */
function decap(nonce: G2Element, usk: G1Element): GTElement {
	return usk.pairing(nonce);
}
