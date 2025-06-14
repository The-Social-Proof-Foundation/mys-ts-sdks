// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { fromBase64, toBase64 } from '@socialproof/bcs';

import { bcs } from '../bcs/index.js';
import { parseSerializedPasskeySignature } from '../keypairs/passkey/publickey.js';
import type { MultiSigStruct } from '../multisig/publickey.js';
import { parseSerializedZkLoginSignature } from '../zklogin/publickey.js';
import { parseSerializedKeypairSignature } from './publickey.js';
import type { PublicKey } from './publickey.js';
import type { SignatureScheme } from './signature-scheme.js';
import { SIGNATURE_FLAG_TO_SCHEME, SIGNATURE_SCHEME_TO_FLAG } from './signature-scheme.js';

/**
 * Pair of signature and corresponding public key
 */
export type SerializeSignatureInput = {
	signatureScheme: SignatureScheme;
	/** Base64-encoded signature */
	signature: Uint8Array;
	/** Base64-encoded public key */
	publicKey?: PublicKey;
};

/**
 * Takes in a signature, its associated signing scheme and a public key, then serializes this data
 */
export function toSerializedSignature({
	signature,
	signatureScheme,
	publicKey,
}: SerializeSignatureInput): string {
	if (!publicKey) {
		throw new Error('`publicKey` is required');
	}

	const pubKeyBytes = publicKey.toRawBytes();
	const serializedSignature = new Uint8Array(1 + signature.length + pubKeyBytes.length);
	serializedSignature.set([SIGNATURE_SCHEME_TO_FLAG[signatureScheme]]);
	serializedSignature.set(signature, 1);
	serializedSignature.set(pubKeyBytes, 1 + signature.length);
	return toBase64(serializedSignature);
}

/**
 * Decodes a serialized signature into its constituent components: the signature scheme, the actual signature, and the public key
 */
export function parseSerializedSignature(serializedSignature: string) {
	const bytes = fromBase64(serializedSignature);

	const signatureScheme =
		SIGNATURE_FLAG_TO_SCHEME[bytes[0] as keyof typeof SIGNATURE_FLAG_TO_SCHEME];

	switch (signatureScheme) {
		case 'Passkey':
			return parseSerializedPasskeySignature(serializedSignature);
		case 'MultiSig':
			const multisig: MultiSigStruct = bcs.MultiSig.parse(bytes.slice(1));
			return {
				serializedSignature,
				signatureScheme,
				multisig,
				bytes,
				signature: undefined,
			};
		case 'ZkLogin':
			return parseSerializedZkLoginSignature(serializedSignature);
		case 'ED25519':
		case 'Secp256k1':
		case 'Secp256r1':
			return parseSerializedKeypairSignature(serializedSignature);
		default:
			throw new Error('Unsupported signature scheme');
	}
}
