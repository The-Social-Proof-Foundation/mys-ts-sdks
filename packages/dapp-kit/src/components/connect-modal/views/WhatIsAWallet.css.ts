// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { style } from '@vanilla-extract/css';

export const container = style({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
});

export const content = style({
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	flexGrow: 1,
	gap: 20,
	padding: 40,
});
