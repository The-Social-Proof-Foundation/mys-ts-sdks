// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

/// <reference types="vitest" />

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [vanillaExtractPlugin() as never],
	test: {
		exclude: [...configDefaults.exclude, 'tests/**'],
		environment: 'happy-dom',
		restoreMocks: true,
		globals: true,
		setupFiles: ['./test/setup.ts'],
	},
	resolve: {
		alias: {
			// TODO: Figure out a better way to run tests that avoids these aliases:
			'@socialproof/wallet-standard': new URL('../wallet-standard/src', import.meta.url).pathname,
			'@socialproof/bcs': new URL('../bcs/src', import.meta.url).pathname,
			'@socialproof/utils': new URL('../utils/src', import.meta.url).pathname,
			'@socialproof/sui/keypairs/ed25519': new URL('../typescript/src/keypairs/ed25519', import.meta.url)
				.pathname,
			'@socialproof/sui/client': new URL('../typescript/src/client', import.meta.url).pathname,
			'@socialproof/sui/utils': new URL('../typescript/src/utils', import.meta.url).pathname,
			'@socialproof/sui/transactions': new URL('../typescript/src/transactions', import.meta.url)
				.pathname,
		},
	},
});
