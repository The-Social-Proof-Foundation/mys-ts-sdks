// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0
import { loader } from 'fumadocs-core/source';

import { docs } from '@/.source';

export const source = loader({
	baseUrl: '/',
	source: docs.toFumadocsSource(),
});
