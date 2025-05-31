// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { buildCommand } from '@stricli/core';

export const generateCommand = buildCommand({
	loader: async () => (await import('./impl')).generate,
	parameters: {
		flags: {
			outputDir: {
				kind: 'parsed',
				parse: String,
				brief: 'Output directory',
			},
		},
		positional: {
			kind: 'array',
			parameter: {
				brief: 'Paths to Move modules',
				parse: String,
			},
		},
		aliases: {
			o: 'outputDir',
		},
	},
	docs: {
		brief: 'Generate BCS and moveCall helpers from you Move code',
	},
});
