// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

const MYS_NS_NAME_REGEX =
	/^(?!.*(^(?!@)|[-.@])($|[-.@]))(?:[a-z0-9-]{0,63}(?:\.[a-z0-9-]{0,63})*)?@[a-z0-9-]{0,63}$/i;
const MYS_NS_DOMAIN_REGEX = /^(?!.*(^|[-.])($|[-.]))(?:[a-z0-9-]{0,63}\.)+mys$/i;
const MAX_MYS_NS_NAME_LENGTH = 235;

export function isValidMysNSName(name: string): boolean {
	if (name.length > MAX_MYS_NS_NAME_LENGTH) {
		return false;
	}

	if (name.includes('@')) {
		return MYS_NS_NAME_REGEX.test(name);
	}

	return MYS_NS_DOMAIN_REGEX.test(name);
}

export function normalizeMysNSName(name: string, format: 'at' | 'dot' = 'at'): string {
	const lowerCase = name.toLowerCase();
	let parts;

	if (lowerCase.includes('@')) {
		if (!MYS_NS_NAME_REGEX.test(lowerCase)) {
			throw new Error(`Invalid MysNS name ${name}`);
		}
		const [labels, domain] = lowerCase.split('@');
		parts = [...(labels ? labels.split('.') : []), domain];
	} else {
		if (!MYS_NS_DOMAIN_REGEX.test(lowerCase)) {
			throw new Error(`Invalid MysNS name ${name}`);
		}
		parts = lowerCase.split('.').slice(0, -1);
	}

	if (format === 'dot') {
		return `${parts.join('.')}.mys`;
	}

	return `${parts.slice(0, -1).join('.')}@${parts[parts.length - 1]}`;
}
