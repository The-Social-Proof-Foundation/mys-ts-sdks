// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0
import { toBase64 } from '@socialproof/bcs';

import type { SignatureScheme } from '../cryptography/index.js';
import { Signer } from '../cryptography/index.js';
import type { MultiSigPublicKey } from './publickey.js';

export class MultiSigSigner extends Signer {
	#pubkey: MultiSigPublicKey;
	#signers: Signer[];

	constructor(pubkey: MultiSigPublicKey, signers: Signer[] = []) {
		super();
		this.#pubkey = pubkey;
		this.#signers = signers;

		const uniqueKeys = new Set();
		let combinedWeight = 0;

		const weights = pubkey.getPublicKeys().map(({ weight, publicKey }) => ({
			weight,
			address: publicKey.toMysAddress(),
		}));

		for (const signer of signers) {
			const address = signer.toMysAddress();
			if (uniqueKeys.has(address)) {
				throw new Error(`Can't create MultiSigSigner with duplicate signers`);
			}
			uniqueKeys.add(address);

			const weight = weights.find((w) => w.address === address)?.weight;

			if (!weight) {
				throw new Error(`Signer ${address} is not part of the MultiSig public key`);
			}

			combinedWeight += weight;
		}

		if (combinedWeight < pubkey.getThreshold()) {
			throw new Error(`Combined weight of signers is less than threshold`);
		}
	}

	getKeyScheme(): SignatureScheme {
		return 'MultiSig';
	}

	getPublicKey(): MultiSigPublicKey {
		return this.#pubkey;
	}

	sign(_data: Uint8Array): never {
		throw new Error(
			'MultiSigSigner does not support signing directly. Use signTransaction or signPersonalMessage instead',
		);
	}

	signData(_data: Uint8Array): never {
		throw new Error(
			'MultiSigSigner does not support signing directly. Use signTransaction or signPersonalMessage instead',
		);
	}

	async signTransaction(bytes: Uint8Array) {
		const signature = this.#pubkey.combinePartialSignatures(
			await Promise.all(
				this.#signers.map(async (signer) => (await signer.signTransaction(bytes)).signature),
			),
		);

		return {
			signature,
			bytes: toBase64(bytes),
		};
	}

	async signPersonalMessage(bytes: Uint8Array) {
		const signature = this.#pubkey.combinePartialSignatures(
			await Promise.all(
				this.#signers.map(async (signer) => (await signer.signPersonalMessage(bytes)).signature),
			),
		);

		return {
			signature,
			bytes: toBase64(bytes),
		};
	}
}
