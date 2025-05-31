#! /usr/bin/env tsx
// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0
import { buildPackage } from './utils/buildPackage.js';

buildPackage().catch((error) => {
	console.error(error);
	process.exit(1);
});
