// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@socialproof/mys/transactions';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import {
	WalletFeatureNotSupportedError,
	WalletNotConnectedError,
} from '../../src/errors/walletErrors.js';
import { useConnectWallet, useSignTransaction } from '../../src/index.js';
import { mysFeatures } from '../mocks/mockFeatures.js';
import { createWalletProviderContextWrapper, registerMockWallet } from '../test-utils.js';

describe('useSignTransaction', () => {
	test('throws an error when trying to sign a transaction without a wallet connection', async () => {
		const wrapper = createWalletProviderContextWrapper();
		const { result } = renderHook(() => useSignTransaction(), { wrapper });

		result.current.mutate({ transaction: new Transaction(), chain: 'mys:testnet' });

		await waitFor(() => expect(result.current.error).toBeInstanceOf(WalletNotConnectedError));
	});

	test('throws an error when trying to sign a transaction with a wallet that lacks feature support', async () => {
		const { unregister, mockWallet } = registerMockWallet({
			walletName: 'Mock Wallet 1',
		});

		const wrapper = createWalletProviderContextWrapper();
		const { result } = renderHook(
			() => ({
				connectWallet: useConnectWallet(),
				signTransaction: useSignTransaction(),
			}),
			{ wrapper },
		);

		result.current.connectWallet.mutate({ wallet: mockWallet });
		await waitFor(() => expect(result.current.connectWallet.isSuccess).toBe(true));

		result.current.signTransaction.mutate({
			transaction: new Transaction(),
			chain: 'mys:testnet',
		});
		await waitFor(() =>
			expect(result.current.signTransaction.error).toBeInstanceOf(WalletFeatureNotSupportedError),
		);

		act(() => unregister());
	});

	test('signing a transaction from the currently connected account works successfully', async () => {
		const { unregister, mockWallet } = registerMockWallet({
			walletName: 'Mock Wallet 1',
			features: mysFeatures,
		});

		const wrapper = createWalletProviderContextWrapper();
		const { result } = renderHook(
			() => ({
				connectWallet: useConnectWallet(),
				signTransaction: useSignTransaction(),
			}),
			{ wrapper },
		);

		result.current.connectWallet.mutate({ wallet: mockWallet });

		await waitFor(() => expect(result.current.connectWallet.isSuccess).toBe(true));

		const signTransactionFeature = mockWallet.features['mys:signTransaction'];
		const signTransactionMock = signTransactionFeature!.signTransaction as Mock;

		signTransactionMock.mockReturnValueOnce({
			bytes: 'abc',
			signature: '123',
		});

		result.current.signTransaction.mutate({
			transaction: new Transaction(),
			chain: 'mys:testnet',
		});

		await waitFor(() => expect(result.current.signTransaction.isSuccess).toBe(true));
		expect(result.current.signTransaction.data).toStrictEqual({
			bytes: 'abc',
			signature: '123',
			reportTransactionEffects: expect.any(Function),
		});

		expect(signTransactionMock).toHaveBeenCalledWith({
			transaction: expect.any(Object),
			account: mockWallet.accounts[0],
			chain: `mys:testnet`,
		});

		act(() => unregister());
	});

	test('defaults the `chain` to the active network', async () => {
		const { unregister, mockWallet } = registerMockWallet({
			walletName: 'Mock Wallet 1',
			features: mysFeatures,
		});

		const wrapper = createWalletProviderContextWrapper();
		const { result } = renderHook(
			() => ({
				connectWallet: useConnectWallet(),
				signTransaction: useSignTransaction(),
			}),
			{ wrapper },
		);

		result.current.connectWallet.mutate({ wallet: mockWallet });

		await waitFor(() => expect(result.current.connectWallet.isSuccess).toBe(true));

		const signTransactionFeature = mockWallet.features['mys:signTransaction'];
		const signTransactionMock = signTransactionFeature!.signTransaction as Mock;

		signTransactionMock.mockReturnValueOnce({
			bytes: 'abc',
			signature: '123',
		});

		result.current.signTransaction.mutate({
			transaction: new Transaction(),
		});

		await waitFor(() => expect(result.current.signTransaction.isSuccess).toBe(true));
		expect(signTransactionMock).toHaveBeenCalledWith({
			transaction: expect.any(Object),
			account: mockWallet.accounts[0],
			chain: 'mys:test',
		});

		act(() => unregister());
	});
});
