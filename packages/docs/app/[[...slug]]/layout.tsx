// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { baseOptions } from '@/app/layout.config';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<DocsLayout
			{...baseOptions}
			tree={source.pageTree}
			sidebar={{
				tabs: [
					{
						title: 'Mys SDK',
						description: 'TypeScript interfaces for Mys',
						url: '/typescript',
					},
					{
						title: 'BCS',
						description: 'Encoding and decoding Mys objects',
						url: '/bcs',
					},
					{
						title: 'Dapp Kit',
						description: 'Build Mys dapps in React',
						url: '/dapp-kit',
					},
					{
						title: 'Kiosk',
						description: 'Interact with on-chain commerce applications',
						url: '/kiosk',
					},
					{
						title: 'Walrus',
						description: 'Publish and Read blobs directly from walrus storage nodes',
						url: '/walrus',
					},
					{
						title: 'zkSend',
						description: 'Send Mys with a link',
						url: '/zksend',
					},
					{
						title: 'API Reference',
						url: '/typedoc/index.html',
					},
				],
			}}
		>
			{children}
		</DocsLayout>
	);
}
