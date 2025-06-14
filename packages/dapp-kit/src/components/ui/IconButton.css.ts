// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { style } from '@vanilla-extract/css';

import { themeVars } from '../../themes/themeContract.js';

export const container = style({
	borderRadius: 9999,
	padding: 8,
	color: themeVars.colors.iconButton,
	backgroundColor: themeVars.backgroundColors.iconButton,
	':hover': {
		backgroundColor: themeVars.backgroundColors.iconButtonHover,
	},
});
