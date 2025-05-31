// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { Transaction } from '@socialproof/mys/transactions';
import { normalizeMysNSName } from '@socialproof/mys/utils';

export function isSubName(name: string): boolean {
	return normalizeMysNSName(name, 'dot').split('.').length > 2;
}

/**
 * Checks if a name is a nested subname.
 * A nested subdomain is a subdomain that is a subdomain of another subdomain.
 * @param name The name to check (e.g test.example.sub.mys)
 */
export function isNestedSubName(name: string): boolean {
	return normalizeMysNSName(name, 'dot').split('.').length > 3;
}

/**
 * The years must be between 1 and 5.
 */
export function validateYears(years: number) {
	if (!(years > 0 && years < 6)) throw new Error('Years must be between 1 and 5');
}

export function zeroCoin(tx: Transaction, type: string) {
	return tx.moveCall({
		target: '0x2::coin::zero',
		typeArguments: [type],
	});
}

export function getConfigType(mysnsPackageV1: string, innerType: string): string {
	return `${mysnsPackageV1}::mysns::ConfigKey<${innerType}>`;
}

export function getDomainType(mysnsPackageV1: string): string {
	return `${mysnsPackageV1}::domain::Domain`;
}

export function getPricelistConfigType(mysnsPackageId: string): string {
	return `${mysnsPackageId}::pricing_config::PricingConfig`;
}

export function getRenewalPricelistConfigType(mysnsPackageId: string): string {
	return `${mysnsPackageId}::pricing_config::RenewalConfig`;
}

export function getCoinDiscountConfigType(paymentPackageId: string): string {
	return `${paymentPackageId}::payments::PaymentsConfig`;
}
