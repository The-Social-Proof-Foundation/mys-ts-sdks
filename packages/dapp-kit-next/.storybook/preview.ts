// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { createDAppKit } from '../src/core';
import { getFullnodeUrl, MysClient } from '@mysocial/mys/client';
import type { Preview } from '@storybook/web-components';

import '../src/components/dapp-kit-connect-button.js';
import '../src/components/dapp-kit-connect-modal.js';

createDAppKit({
	networks: ['testnet'],
	createClient(network) {
		return new MysClient({ network, url: getFullnodeUrl(network) });
	},
});

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
};

export default preview;
