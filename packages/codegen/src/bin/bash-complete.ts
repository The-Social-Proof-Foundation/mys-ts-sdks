#!/usr/bin/env node
// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { proposeCompletions } from '@stricli/core';
import { buildContext } from '../cli/context.js';
import { buildCli } from '../cli/cli.js';

const { version }: { version: string } = require('../../../package.json');
const cli = buildCli(version);

const inputs = process.argv.slice(3);
if (process.env['COMP_LINE']?.endsWith(' ')) {
	inputs.push('');
}

export async function main() {
	await proposeCompletions(cli, inputs, buildContext(process));

	try {
		for (const { completion } of await proposeCompletions(cli, inputs, buildContext(process))) {
			process.stdout.write(`${completion}\n`);
		}
	} catch {
		// ignore
	}
}

main().then(
	() => process.exit(0),
	(error) => {
		console.error(error);
		process.exit(1);
	},
);
