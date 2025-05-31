// Copyright (c) MySocial, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import './global.css';

import { RootProvider } from 'fumadocs-ui/provider';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

export const metadata: Metadata = {
	title: {
		template: '%s | MySocial TypeScript SDK Docs',
		default: 'MySocial TypeScript SDK Docs',
	},
	description:
		'MySocial TypeScript SDK Docs. Discover the power of MySocial through examples, guides, and concepts.',
	openGraph: {
		title: 'MySocial TypeScript SDK Docs',
		description:
			'MySocial TypeScript SDK Docs. Discover the power of MySocial through examples, guides, and concepts.',
		siteName: 'MySocial TypeScript SDK Docs',
	},
	appleWebApp: {
		title: 'MySocial TypeScript SDK Docs',
	},
};

const inter = Inter({
	subsets: ['latin'],
});

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={inter.className} suppressHydrationWarning>
			<head>
				<meta
					name="google-site-verification"
					content="T-2HWJAKh8s63o9KFxCFXg5MON_NGLJG76KJzr_Hp0A"
				/>
				<meta httpEquiv="Content-Language" content="en" />
			</head>
			<body className="flex flex-col min-h-screen">
				<RootProvider>{children}</RootProvider>
			</body>
		</html>
	);
}
