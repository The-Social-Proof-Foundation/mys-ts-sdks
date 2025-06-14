// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { SessionKey } from '../../src/session-key';
import { Ed25519Keypair } from '@socialproof/mys/keypairs/ed25519';
import { MysGraphQLClient } from '@socialproof/mys/graphql';
import { UserError } from '../../src/error';

describe('Session key tests', () => {
	const TESTNET_PACKAGE_ID = '0x9709d4ee371488c2bc09f508e98e881bd1d5335e0805d7e6a99edd54a7027954';
	it('import and export session key', async () => {
		const kp = Ed25519Keypair.generate();
		const mysClient = new MysGraphQLClient({ url: 'https://testnet.mysocial.network/graphql' });
		const sessionKey = new SessionKey({
			address: kp.getPublicKey().toMysAddress(),
			packageId: TESTNET_PACKAGE_ID,
			ttlMin: 1,
			mysClient,
		});
		const sig = await kp.signPersonalMessage(sessionKey.getPersonalMessage());
		await sessionKey.setPersonalMessageSignature(sig.signature);

		const exportedSessionKey = sessionKey.export();
		const restoredSessionKey = SessionKey.import(exportedSessionKey, mysClient);

		expect(restoredSessionKey.getAddress()).toBe(kp.getPublicKey().toMysAddress());
		expect(restoredSessionKey.getPackageId()).toBe(TESTNET_PACKAGE_ID);
		expect(restoredSessionKey.export().sessionKey).toBe(sessionKey.export().sessionKey);
		expect(restoredSessionKey.getPersonalMessage()).toEqual(sessionKey.getPersonalMessage());

		// invalid signer
		const kp2 = Ed25519Keypair.generate();
		expect(() =>
			SessionKey.import(
				{
					address: kp.getPublicKey().toMysAddress(),
					packageId: TESTNET_PACKAGE_ID,
					ttlMin: 1,
					sessionKey: sessionKey.export().sessionKey,
					creationTimeMs: sessionKey.export().creationTimeMs,
					personalMessageSignature: sig.signature,
				},
				mysClient,
				kp2,
			),
		).toThrow(UserError);
	});
});
