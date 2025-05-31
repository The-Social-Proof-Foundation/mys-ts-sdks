// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { SignatureWithBytes } from '@socialproof/mys/cryptography';
import { Signer } from '@socialproof/mys/cryptography';
import type { ZkLoginSignatureInputs } from '@socialproof/mys/zklogin';
import { getZkLoginSignature, ZkLoginPublicIdentifier } from '@socialproof/mys/zklogin';

export class EnokiPublicKey extends ZkLoginPublicIdentifier {}

export class EnokiKeypair extends Signer {
	#proof: ZkLoginSignatureInputs;
	#maxEpoch: number;
	#ephemeralKeypair: Signer;
	#publicKey: EnokiPublicKey;

	constructor(input: {
		address: string;
		maxEpoch: number;
		proof: ZkLoginSignatureInputs;
		ephemeralKeypair: Signer;
	}) {
		super();
		this.#proof = input.proof;
		this.#maxEpoch = input.maxEpoch;
		this.#ephemeralKeypair = input.ephemeralKeypair;
		this.#publicKey = EnokiPublicKey.fromProof(input.address, input.proof);
	}

	async sign(data: Uint8Array) {
		return this.#ephemeralKeypair.sign(data);
	}

	async signPersonalMessage(bytes: Uint8Array): Promise<SignatureWithBytes> {
		const { bytes: signedBytes, signature: userSignature } =
			await this.#ephemeralKeypair.signPersonalMessage(bytes);

		const zkSignature = getZkLoginSignature({
			inputs: this.#proof,
			maxEpoch: this.#maxEpoch,
			userSignature,
		});

		return {
			bytes: signedBytes,
			signature: zkSignature,
		};
	}

	async signTransaction(bytes: Uint8Array): Promise<SignatureWithBytes> {
		const { bytes: signedBytes, signature: userSignature } =
			await this.#ephemeralKeypair.signTransaction(bytes);

		const zkSignature = getZkLoginSignature({
			inputs: this.#proof,
			maxEpoch: this.#maxEpoch,
			userSignature,
		});

		return {
			bytes: signedBytes,
			signature: zkSignature,
		};
	}

	getKeyScheme() {
		return this.#ephemeralKeypair.getKeyScheme();
	}

	getPublicKey() {
		return this.#publicKey;
	}
}
