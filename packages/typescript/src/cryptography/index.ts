// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

export {
	type SerializeSignatureInput,
	toSerializedSignature,
	parseSerializedSignature,
} from './signature.js';
export {
	SIGNATURE_SCHEME_TO_FLAG,
	SIGNATURE_SCHEME_TO_SIZE,
	SIGNATURE_FLAG_TO_SCHEME,
	type SignatureScheme,
	type SignatureFlag,
} from './signature-scheme.js';
export {
	isValidHardenedPath,
	isValidBIP32Path,
	mnemonicToSeed,
	mnemonicToSeedHex,
} from './mnemonics.js';
export { messageWithIntent } from './intent.js';
export type { IntentScope } from './intent.js';
export {
	PRIVATE_KEY_SIZE,
	LEGACY_PRIVATE_KEY_SIZE,
	MYS_PRIVATE_KEY_PREFIX,
	type ParsedKeypair,
	type SignatureWithBytes,
	Signer,
	Keypair,
	decodeMysPrivateKey,
	encodeMysPrivateKey,
} from './keypair.js';

export { PublicKey } from './publickey.js';
