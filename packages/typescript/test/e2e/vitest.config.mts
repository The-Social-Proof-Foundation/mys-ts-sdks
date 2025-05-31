// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		minWorkers: 1,
		maxWorkers: 4,
		hookTimeout: 1000000,
		testTimeout: 1000000,
		env: {
			NODE_ENV: 'test',
		},
		setupFiles: ['test/e2e/utils/setupEnv.ts'],
		globalSetup: ['test/e2e/utils/globalSetup.ts'],
		include: ['test/e2e/**/*.test.ts'],
	},
	resolve: {
		alias: {
			'@socialproof/bcs': new URL('../../../bcs/src', import.meta.url).pathname,
			'@socialproof/utils': new URL('../../../utils/src', import.meta.url).pathname,
		},
	},
});
