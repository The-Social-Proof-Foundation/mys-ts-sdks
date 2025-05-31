// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { DisplayFieldsResponse } from '@mysocial/mys/client';

export function formatDisplay(object: {
	display?:
		| {
				key: string;
				value?: string | null | undefined;
				error?: string | null | undefined;
		  }[]
		| null;
}) {
	const display: DisplayFieldsResponse = {
		data: null,
		error: null,
	};

	if (object.display) {
		object.display.forEach((displayItem) => {
			if (displayItem.error) {
				display!.error = displayItem.error as never;
			} else if (displayItem.value != null) {
				if (!display!.data) {
					display!.data = {};
				}
				display!.data[displayItem.key] = displayItem.value;
			}
		});
	}

	return display;
}
