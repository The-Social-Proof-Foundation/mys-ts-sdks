// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	reactStrictMode: true,
	serverExternalPackages: [
		'ts-morph',
		'typescript',
		'oxc-transform',
		'@shikijs/twoslash',
		'fumadocs-docgen',
	],
	redirects: () => {
		return [
			{
				source: '/',
				destination: '/typescript',
				statusCode: 302,
			},
			{
				source: '/dapp-kit/zksend',
				destination: '/dapp-kit/slush',
				statusCode: 302,
			},
			{
				source: '/dapp-kit/stashed',
				destination: '/dapp-kit/slush',
				statusCode: 302,
			},
		];
	},
};

export default withMDX(config);
