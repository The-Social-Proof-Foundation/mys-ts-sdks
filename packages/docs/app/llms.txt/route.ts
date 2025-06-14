// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0
import * as fs from 'node:fs/promises';
import fg from 'fast-glob';
import { remarkInstall } from 'fumadocs-docgen';
import { remarkInclude } from 'fumadocs-mdx/config';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkStringify from 'remark-stringify';

export const revalidate = false;

export async function GET() {
	// all scanned content
	const files = await fg(['./content/**/*.mdx']);

	const scan = files.map(async (file) => {
		const fileContent = await fs.readFile(file);
		const { content, data } = matter(fileContent.toString());

		const processed = await processContent(content);
		return `file: ${file}
meta: ${JSON.stringify(data, null, 2)}

${processed}`;
	});

	const scanned = await Promise.all(scan);

	return new Response(scanned.join('\n\n'));
}

async function processContent(content: string): Promise<string> {
	const file = await remark()
		.use(remarkMdx)
		.use(remarkInclude)
		.use(remarkGfm)
		.use(remarkInstall, { persist: { id: 'package-manager' } })
		.use(remarkStringify)
		.process(content);

	return String(file);
}
