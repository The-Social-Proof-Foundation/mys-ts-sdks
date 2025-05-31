// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

export function getClientMetadata() {
	return {
		version: '1',
		originUrl: window.location.href,
		userAgent: navigator.userAgent,
		screenResolution: `${window.screen.width}x${window.screen.height}`,
		language: navigator.language,
		platform: navigator.platform,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		timestamp: Date.now(),
	};
}
