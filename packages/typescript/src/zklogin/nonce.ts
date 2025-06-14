// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { toHex } from '@socialproof/bcs';
import { randomBytes } from '@noble/hashes/utils';
import { base64urlnopad } from '@scure/base';

import type { PublicKey } from '../cryptography/publickey.js';
import { poseidonHash } from './poseidon.js';
import { toPaddedBigEndianBytes } from './utils.js';

export const NONCE_LENGTH = 27;

function toBigIntBE(bytes: Uint8Array) {
	const hex = toHex(bytes);
	if (hex.length === 0) {
		return BigInt(0);
	}
	return BigInt(`0x${hex}`);
}

export function generateRandomness() {
	// Once Node 20 enters LTS, we can just use crypto.getRandomValues(new Uint8Array(16)), but until then we use `randomBytes` to improve compatibility:
	return String(toBigIntBE(randomBytes(16)));
}

export function generateNonce(publicKey: PublicKey, maxEpoch: number, randomness: bigint | string) {
	const publicKeyBytes = toBigIntBE(publicKey.toMysBytes());
	const eph_public_key_0 = publicKeyBytes / 2n ** 128n;
	const eph_public_key_1 = publicKeyBytes % 2n ** 128n;
	const bigNum = poseidonHash([eph_public_key_0, eph_public_key_1, maxEpoch, BigInt(randomness)]);
	const Z = toPaddedBigEndianBytes(bigNum, 20);
	const nonce = base64urlnopad.encode(Z);

	if (nonce.length !== NONCE_LENGTH) {
		throw new Error(`Length of nonce ${nonce} (${nonce.length}) is not equal to ${NONCE_LENGTH}`);
	}
	return nonce;
}
