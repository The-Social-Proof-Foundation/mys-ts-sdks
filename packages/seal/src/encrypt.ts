// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { fromHex } from '@socialproof/bcs';
import { isValidMysObjectId } from '@socialproof/mys/utils';
import { split as externalSplit } from 'shamir-secret-sharing';

import type { IBEEncryptions } from './bcs.js';
import { EncryptedObject } from './bcs.js';
import type { EncryptionInput } from './dem.js';
import { UserError } from './error.js';
import { BonehFranklinBLS12381Services } from './ibe.js';
import { deriveKey, KeyPurpose } from './kdf.js';
import type { KeyServer } from './key-server.js';
import { createFullId } from './utils.js';

export const MAX_U8 = 255;

/**
 * Given full ID and what key servers to use, return the encrypted message under the identity and return the bcs bytes of the encrypted object.
 *
 * @param keyServers - A list of KeyServers (same server can be used multiple times)
 * @param kemType - The type of KEM to use.
 * @param packageId - packageId
 * @param id - id
 * @param encryptionInput - Input to the encryption. Should be one of the EncryptionInput types, AesGcmEncryptionInput or Plain.
 * @param threshold - The threshold for the TSS encryption.
 * @returns The bcs bytes of the encrypted object containing all metadata and the 256-bit symmetric key that was used to encrypt the object.
 * Since the key can be used to decrypt, it should not be shared but can be used eg. for backup.
 */
export async function encrypt({
	keyServers,
	kemType,
	threshold,
	packageId,
	id,
	encryptionInput,
}: {
	keyServers: KeyServer[];
	kemType: KemType;
	threshold: number;
	packageId: string;
	id: string;
	encryptionInput: EncryptionInput;
}): Promise<{
	encryptedObject: Uint8Array;
	key: Uint8Array;
}> {
	// Check inputs
	if (
		keyServers.length < threshold ||
		threshold === 0 ||
		keyServers.length > MAX_U8 ||
		threshold > MAX_U8 ||
		!isValidMysObjectId(packageId)
	) {
		throw new UserError(
			`Invalid key servers or threshold ${threshold} for ${keyServers.length} key servers for package ${packageId}`,
		);
	}

	// Generate a random base key.
	const baseKey = await encryptionInput.generateKey();

	// Split the key into shares and encrypt each share with the public keys of the key servers.
	const shares = await split(baseKey, keyServers.length, threshold);

	// Encrypt the shares with the public keys of the key servers.
	const fullId = createFullId(packageId, id);
	const encryptedShares = encryptBatched(
		keyServers,
		kemType,
		fromHex(fullId),
		shares.map(({ share, index }) => ({
			msg: share,
			index,
		})),
		baseKey,
		threshold,
	);

	// Encrypt the object with the derived DEM key.
	const demKey = deriveKey(
		KeyPurpose.DEM,
		baseKey,
		encryptedShares.BonehFranklinBLS12381.encryptedShares,
		threshold,
		keyServers.map(({ objectId }) => objectId),
	);
	const ciphertext = await encryptionInput.encrypt(demKey);

	// Services and indices of their shares are stored as a tuple
	const services: [string, number][] = keyServers.map(({ objectId }, i) => [
		objectId,
		shares[i].index,
	]);

	return {
		encryptedObject: EncryptedObject.serialize({
			version: 0,
			packageId,
			id,
			services,
			threshold,
			encryptedShares,
			ciphertext,
		}).toBytes(),
		key: demKey,
	};
}

export enum KemType {
	BonehFranklinBLS12381DemCCA = 0,
}

export enum DemType {
	AesGcm256 = 0,
	Hmac256Ctr = 1,
}

function encryptBatched(
	keyServers: KeyServer[],
	kemType: KemType,
	id: Uint8Array,
	msgs: { msg: Uint8Array; index: number }[],
	baseKey: Uint8Array,
	threshold: number,
): typeof IBEEncryptions.$inferType {
	switch (kemType) {
		case KemType.BonehFranklinBLS12381DemCCA:
			return new BonehFranklinBLS12381Services(keyServers).encryptBatched(
				id,
				msgs,
				baseKey,
				threshold,
			);
	}
}

async function split(
	secret: Uint8Array,
	n: number,
	threshold: number,
): Promise<{ index: number; share: Uint8Array }[]> {
	// The externalSplit function is from the 'shamir-secret-sharing' package and requires t > 1 and n >= 2.
	// So we handle the special cases here.
	if (n === 0 || threshold === 0 || threshold > n) {
		throw new Error('Invalid threshold or number of shares');
	} else if (threshold === 1) {
		// If the threshold is 1, the secret is not split.
		const share = secret;

		const result = [];
		for (let index = 1; index <= n; index++) {
			// The shared polynomial is a constant in this case, so the index doesn't matter.
			// To make sure they are unique, we use a counter.
			result.push({ share, index });
		}
		return Promise.resolve(result);
	}

	return externalSplit(secret, n, threshold).then((share) =>
		share.map((s) => ({
			share: s.subarray(0, s.length - 1),
			// split() returns the share index in the last byte. See https://github.com/privy-io/shamir-secret-sharing/blob/b59534d03e66d44ae36fc074aaf0684aa39c7505/src/index.ts#L247.
			index: s[s.length - 1],
		})),
	);
}
