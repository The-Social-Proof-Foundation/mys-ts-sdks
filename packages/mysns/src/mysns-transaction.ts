// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@socialproof/mys/bcs';
import type {
	Transaction,
	TransactionObjectArgument,
	TransactionObjectInput,
} from '@socialproof/mys/transactions';
import { isValidMysNSName, normalizeMysNSName, MYS_CLOCK_OBJECT_ID } from '@socialproof/mys/utils';

import { ALLOWED_METADATA, MAX_U64 } from './constants.js';
import { isNestedSubName, isSubName, zeroCoin } from './helpers.js';
import type { MysnsClient } from './mysns-client.js';
import type { DiscountInfo, ReceiptParams, RegistrationParams, RenewalParams } from './types.js';

export class MysnsTransaction {
	mysnsClient: MysnsClient;
	transaction: Transaction;

	constructor(client: MysnsClient, transaction: Transaction) {
		this.mysnsClient = client;
		this.transaction = transaction;
	}

	/**
	 * Registers a domain for a number of years.
	 */
	register(params: RegistrationParams): TransactionObjectArgument {
		if (params.couponCode && params.discountInfo) {
			throw new Error('Cannot apply both coupon and discount NFT');
		}

		const paymentIntent = this.initRegistration(params.domain);
		if (params.couponCode) {
			this.applyCoupon(paymentIntent, params.couponCode);
		}
		if (params.discountInfo) {
			this.applyDiscount(paymentIntent, params.discountInfo);
		}
		const priceAfterDiscount = this.calculatePriceAfterDiscount(
			paymentIntent,
			params.coinConfig.type,
		);
		const receipt = this.generateReceipt({
			paymentIntent,
			priceAfterDiscount,
			coinConfig: params.coinConfig,
			coin: params.coin,
			maxAmount: params.maxAmount,
			priceInfoObjectId: params.priceInfoObjectId,
		});
		const nft = this.finalizeRegister(receipt);

		if (params.years > 1) {
			this.renew({
				nft,
				years: params.years - 1,
				coinConfig: params.coinConfig,
				coin: params.coin,
				couponCode: params.couponCode,
				discountInfo: params.discountInfo,
				maxAmount: params.maxAmount,
				priceInfoObjectId: params.priceInfoObjectId,
			});
		}

		return nft as TransactionObjectArgument;
	}

	/**
	 * Renews an NFT for a number of years.
	 */
	renew(params: RenewalParams): void {
		if (params.couponCode && params.discountInfo) {
			throw new Error('Cannot apply both coupon and discount NFT');
		}

		const paymentIntent = this.initRenewal(params.nft, params.years);
		if (params.couponCode) {
			this.applyCoupon(paymentIntent, params.couponCode);
		}
		if (params.discountInfo) {
			this.applyDiscount(paymentIntent, params.discountInfo);
		}
		const priceAfterDiscount = this.calculatePriceAfterDiscount(
			paymentIntent,
			params.coinConfig.type,
		);
		const receipt = this.generateReceipt({
			paymentIntent,
			priceAfterDiscount,
			coinConfig: params.coinConfig,
			coin: params.coin,
			maxAmount: params.maxAmount,
			priceInfoObjectId: params.priceInfoObjectId,
		});
		this.finalizeRenew(receipt, params.nft);
	}

	initRegistration(domain: string): TransactionObjectArgument {
		const config = this.mysnsClient.config;
		return this.transaction.moveCall({
			target: `${config.packageId}::payment::init_registration`,
			arguments: [this.transaction.object(config.mysns), this.transaction.pure.string(domain)],
		});
	}

	initRenewal(nft: TransactionObjectInput, years: number): TransactionObjectArgument {
		const config = this.mysnsClient.config;
		return this.transaction.moveCall({
			target: `${config.packageId}::payment::init_renewal`,
			arguments: [
				this.transaction.object(config.mysns),
				this.transaction.object(nft),
				this.transaction.pure.u8(years),
			],
		});
	}

	calculatePrice(
		baseAmount: TransactionObjectArgument,
		paymentType: string,
		priceInfoObjectId: string,
	): TransactionObjectArgument {
		const config = this.mysnsClient.config;
		return this.transaction.moveCall({
			target: `${config.payments.packageId}::payments::calculate_price`,
			arguments: [
				this.transaction.object(config.mysns),
				baseAmount,
				this.transaction.object.clock(),
				this.transaction.object(priceInfoObjectId),
			],
			typeArguments: [paymentType],
		});
	}

	handleBasePayment(
		paymentIntent: TransactionObjectArgument,
		payment: TransactionObjectArgument,
		paymentType: string,
	): TransactionObjectArgument {
		const config = this.mysnsClient.config;
		return this.transaction.moveCall({
			target: `${config.payments.packageId}::payments::handle_base_payment`,
			arguments: [this.transaction.object(config.mysns), paymentIntent, payment],
			typeArguments: [paymentType],
		});
	}

	handlePayment(
		paymentIntent: TransactionObjectArgument,
		payment: TransactionObjectArgument,
		paymentType: string,
		priceInfoObjectId: string,
		maxAmount: bigint = MAX_U64,
	): TransactionObjectArgument {
		const config = this.mysnsClient.config;
		return this.transaction.moveCall({
			target: `${config.payments.packageId}::payments::handle_payment`,
			arguments: [
				this.transaction.object(config.mysns),
				paymentIntent,
				payment,
				this.transaction.object.clock(),
				this.transaction.object(priceInfoObjectId),
				this.transaction.pure.u64(maxAmount),
			],
			typeArguments: [paymentType],
		});
	}

	finalizeRegister(receipt: TransactionObjectArgument): TransactionObjectArgument {
		const config = this.mysnsClient.config;
		return this.transaction.moveCall({
			target: `${config.packageId}::payment::register`,
			arguments: [receipt, this.transaction.object(config.mysns), this.transaction.object.clock()],
		});
	}

	finalizeRenew(
		receipt: TransactionObjectArgument,
		nft: TransactionObjectInput,
	): TransactionObjectArgument {
		const config = this.mysnsClient.config;
		return this.transaction.moveCall({
			target: `${config.packageId}::payment::renew`,
			arguments: [
				receipt,
				this.transaction.object(config.mysns),
				this.transaction.object(nft),
				this.transaction.object.clock(),
			],
		});
	}

	calculatePriceAfterDiscount(
		paymentIntent: TransactionObjectArgument,
		paymentType: string,
	): TransactionObjectArgument {
		const config = this.mysnsClient.config;
		return this.transaction.moveCall({
			target: `${config.payments.packageId}::payments::calculate_price_after_discount`,
			arguments: [this.transaction.object(config.mysns), paymentIntent],
			typeArguments: [paymentType],
		});
	}

	generateReceipt(params: ReceiptParams): TransactionObjectArgument {
		const baseAssetPurchase = params.coinConfig.feed === '';
		if (baseAssetPurchase) {
			const payment = params.coin
				? this.transaction.splitCoins(this.transaction.object(params.coin), [
						params.priceAfterDiscount,
					])
				: zeroCoin(this.transaction, params.coinConfig.type);
			const receipt = this.handleBasePayment(params.paymentIntent, payment, params.coinConfig.type);
			return receipt;
		} else {
			const priceInfoObjectId = params.priceInfoObjectId;
			if (!priceInfoObjectId)
				throw new Error('Price info object ID is required for non-base asset purchases');
			const price = this.calculatePrice(
				params.priceAfterDiscount,
				params.coinConfig.type,
				priceInfoObjectId,
			);
			if (!params.coin) throw new Error('coin input is required');
			const payment = this.transaction.splitCoins(this.transaction.object(params.coin!), [price]);
			const receipt = this.handlePayment(
				params.paymentIntent,
				payment,
				params.coinConfig.type,
				priceInfoObjectId,
				params.maxAmount,
			);
			return receipt;
		}
	}

	/**
	 * Applies a coupon to the payment intent.
	 */
	applyCoupon(intent: TransactionObjectArgument, couponCode: string): TransactionObjectArgument {
		const config = this.mysnsClient.config;
		return this.transaction.moveCall({
			target: `${config.coupons.packageId}::coupon_house::apply_coupon`,
			arguments: [
				this.transaction.object(config.mysns),
				intent,
				this.transaction.pure.string(couponCode),
				this.transaction.object.clock(),
			],
		});
	}

	/**
	 * Applies a discount to the payment intent.
	 */
	applyDiscount(intent: TransactionObjectArgument, discountInfo: DiscountInfo): void {
		const config = this.mysnsClient.config;

		if (discountInfo.isFreeClaim) {
			this.transaction.moveCall({
				target: `${config.discountsPackage.packageId}::free_claims::free_claim`,
				arguments: [
					this.transaction.object(config.discountsPackage.discountHouseId),
					this.transaction.object(config.mysns),
					intent,
					this.transaction.object(discountInfo.discountNft),
				],
				typeArguments: [discountInfo.type],
			});
		} else {
			this.transaction.moveCall({
				target: `${config.discountsPackage.packageId}::discounts::apply_percentage_discount`,
				arguments: [
					this.transaction.object(config.discountsPackage.discountHouseId),
					intent,
					this.transaction.object(config.mysns),
					this.transaction.object(discountInfo.discountNft),
				],
				typeArguments: [discountInfo.type],
			});
		}
	}

	/**
	 * Creates a subdomain.
	 */
	createSubName({
		parentNft,
		name,
		expirationTimestampMs,
		allowChildCreation,
		allowTimeExtension,
	}: {
		parentNft: TransactionObjectInput;
		name: string;
		expirationTimestampMs: number;
		allowChildCreation: boolean;
		allowTimeExtension: boolean;
	}) {
		if (!isValidMysNSName(name)) throw new Error('Invalid MysNS name');
		const isParentSubdomain = isNestedSubName(name);
		if (!this.mysnsClient.config.mysns) throw new Error('MysNS Object ID not found');
		if (!this.mysnsClient.config.subNamesPackageId)
			throw new Error('Subnames package ID not found');
		if (isParentSubdomain && !this.mysnsClient.config.tempSubdomainsProxyPackageId)
			throw new Error('Subnames proxy package ID not found');

		const subNft = this.transaction.moveCall({
			target: isParentSubdomain
				? `${this.mysnsClient.config.tempSubdomainsProxyPackageId}::subdomain_proxy::new`
				: `${this.mysnsClient.config.subNamesPackageId}::subdomains::new`,
			arguments: [
				this.transaction.object(this.mysnsClient.config.mysns),
				this.transaction.object(parentNft),
				this.transaction.object(MYS_CLOCK_OBJECT_ID),
				this.transaction.pure.string(normalizeMysNSName(name, 'dot')),
				this.transaction.pure.u64(expirationTimestampMs),
				this.transaction.pure.bool(!!allowChildCreation),
				this.transaction.pure.bool(!!allowTimeExtension),
			],
		});

		return subNft;
	}

	/**
	 * Builds the PTB to create a leaf subdomain.
	 * Parent can be a `MysnsRegistration` or a `SubDomainRegistration` object.
	 * Can be passed in as an ID or a TransactionArgument.
	 */
	createLeafSubName({
		parentNft,
		name,
		targetAddress,
	}: {
		parentNft: TransactionObjectInput;
		name: string;
		targetAddress: string;
	}) {
		if (!isValidMysNSName(name)) throw new Error('Invalid MysNS name');
		const isParentSubdomain = isNestedSubName(name);
		if (!this.mysnsClient.config.mysns) throw new Error('MysNS Object ID not found');
		if (!this.mysnsClient.config.subNamesPackageId)
			throw new Error('Subnames package ID not found');
		if (isParentSubdomain && !this.mysnsClient.config.tempSubdomainsProxyPackageId)
			throw new Error('Subnames proxy package ID not found');

		this.transaction.moveCall({
			target: isParentSubdomain
				? `${this.mysnsClient.config.tempSubdomainsProxyPackageId}::subdomain_proxy::new_leaf`
				: `${this.mysnsClient.config.subNamesPackageId}::subdomains::new_leaf`,
			arguments: [
				this.transaction.object(this.mysnsClient.config.mysns),
				this.transaction.object(parentNft),
				this.transaction.object(MYS_CLOCK_OBJECT_ID),
				this.transaction.pure.string(normalizeMysNSName(name, 'dot')),
				this.transaction.pure.address(targetAddress),
			],
		});
	}

	/**
	 * Removes a leaf subname.
	 */
	removeLeafSubName({ parentNft, name }: { parentNft: TransactionObjectInput; name: string }) {
		if (!isValidMysNSName(name)) throw new Error('Invalid MysNS name');
		const isParentSubdomain = isNestedSubName(name);
		if (!isSubName(name)) throw new Error('This can only be invoked for subnames');
		if (!this.mysnsClient.config.mysns) throw new Error('MysNS Object ID not found');
		if (!this.mysnsClient.config.subNamesPackageId)
			throw new Error('Subnames package ID not found');
		if (isParentSubdomain && !this.mysnsClient.config.tempSubdomainsProxyPackageId)
			throw new Error('Subnames proxy package ID not found');

		this.transaction.moveCall({
			target: isParentSubdomain
				? `${this.mysnsClient.config.tempSubdomainsProxyPackageId}::subdomain_proxy::remove_leaf`
				: `${this.mysnsClient.config.subNamesPackageId}::subdomains::remove_leaf`,
			arguments: [
				this.transaction.object(this.mysnsClient.config.mysns),
				this.transaction.object(parentNft),
				this.transaction.object(MYS_CLOCK_OBJECT_ID),
				this.transaction.pure.string(normalizeMysNSName(name, 'dot')),
			],
		});
	}

	/**
	 * Sets the target address of an NFT.
	 */
	setTargetAddress({
		nft, // Can be string or argument
		address,
		isSubname,
	}: {
		nft: TransactionObjectInput;
		address?: string;
		isSubname?: boolean;
	}) {
		if (isSubname && !this.mysnsClient.config.tempSubdomainsProxyPackageId)
			throw new Error('Subnames proxy package ID not found');

		this.transaction.moveCall({
			target: isSubname
				? `${this.mysnsClient.config.tempSubdomainsProxyPackageId}::subdomain_proxy::set_target_address`
				: `${this.mysnsClient.config.packageId}::controller::set_target_address`,
			arguments: [
				this.transaction.object(this.mysnsClient.config.mysns),
				this.transaction.object(nft),
				this.transaction.pure(bcs.option(bcs.Address).serialize(address).toBytes()),
				this.transaction.object(MYS_CLOCK_OBJECT_ID),
			],
		});
	}

	/**
	 * Sets a default name for the user.
	 */
	setDefault(name: string) {
		if (!isValidMysNSName(name)) throw new Error('Invalid MysNS name');
		if (!this.mysnsClient.config.mysns) throw new Error('MysNS Object ID not found');

		this.transaction.moveCall({
			target: `${this.mysnsClient.config.packageId}::controller::set_reverse_lookup`,
			arguments: [
				this.transaction.object(this.mysnsClient.config.mysns),
				this.transaction.pure.string(normalizeMysNSName(name, 'dot')),
			],
		});
	}

	/**
	 * Edits the setup of a subname.
	 */
	editSetup({
		parentNft,
		name,
		allowChildCreation,
		allowTimeExtension,
	}: {
		parentNft: TransactionObjectInput;
		name: string;
		allowChildCreation: boolean;
		allowTimeExtension: boolean;
	}) {
		if (!isValidMysNSName(name)) throw new Error('Invalid MysNS name');
		const isParentSubdomain = isNestedSubName(name);
		if (!this.mysnsClient.config.mysns) throw new Error('MysNS Object ID not found');
		if (!isParentSubdomain && !this.mysnsClient.config.subNamesPackageId)
			throw new Error('Subnames package ID not found');
		if (isParentSubdomain && !this.mysnsClient.config.tempSubdomainsProxyPackageId)
			throw new Error('Subnames proxy package ID not found');

		this.transaction.moveCall({
			target: isParentSubdomain
				? `${this.mysnsClient.config.tempSubdomainsProxyPackageId}::subdomain_proxy::edit_setup`
				: `${this.mysnsClient.config.subNamesPackageId}::subdomains::edit_setup`,
			arguments: [
				this.transaction.object(this.mysnsClient.config.mysns),
				this.transaction.object(parentNft),
				this.transaction.object(MYS_CLOCK_OBJECT_ID),
				this.transaction.pure.string(normalizeMysNSName(name, 'dot')),
				this.transaction.pure.bool(!!allowChildCreation),
				this.transaction.pure.bool(!!allowTimeExtension),
			],
		});
	}

	/**
	 * Extends the expiration of a subname.
	 */
	extendExpiration({
		nft,
		expirationTimestampMs,
	}: {
		nft: TransactionObjectInput;
		expirationTimestampMs: number;
	}) {
		if (!this.mysnsClient.config.mysns) throw new Error('MysNS Object ID not found');
		if (!this.mysnsClient.config.subNamesPackageId)
			throw new Error('Subnames package ID not found');

		this.transaction.moveCall({
			target: `${this.mysnsClient.config.subNamesPackageId}::subdomains::extend_expiration`,
			arguments: [
				this.transaction.object(this.mysnsClient.config.mysns),
				this.transaction.object(nft),
				this.transaction.pure.u64(expirationTimestampMs),
			],
		});
	}

	/**
	 * Sets the user data of an NFT.
	 */
	setUserData({
		nft,
		value,
		key,
		isSubname,
	}: {
		nft: TransactionObjectInput;
		value: string;
		key: string;
		isSubname?: boolean;
	}) {
		if (!this.mysnsClient.config.mysns) throw new Error('MysNS Object ID not found');
		if (isSubname && !this.mysnsClient.config.tempSubdomainsProxyPackageId)
			throw new Error('Subnames proxy package ID not found');

		if (!Object.values(ALLOWED_METADATA).some((x) => x === key)) throw new Error('Invalid key');

		this.transaction.moveCall({
			target: isSubname
				? `${this.mysnsClient.config.tempSubdomainsProxyPackageId}::subdomain_proxy::set_user_data`
				: `${this.mysnsClient.config.packageId}::controller::set_user_data`,
			arguments: [
				this.transaction.object(this.mysnsClient.config.mysns),
				this.transaction.object(nft),
				this.transaction.pure.string(key),
				this.transaction.pure.string(value),
				this.transaction.object(MYS_CLOCK_OBJECT_ID),
			],
		});
	}

	/**
	 * Burns an expired NFT to collect storage rebates.
	 */
	burnExpired({ nft, isSubname }: { nft: TransactionObjectInput; isSubname?: boolean }) {
		if (!this.mysnsClient.config.mysns) throw new Error('MysNS Object ID not found');

		this.transaction.moveCall({
			target: `${this.mysnsClient.config.packageId}::controller::${
				isSubname ? 'burn_expired_subname' : 'burn_expired'
			}`, // Update this
			arguments: [
				this.transaction.object(this.mysnsClient.config.mysns),
				this.transaction.object(nft),
				this.transaction.object(MYS_CLOCK_OBJECT_ID),
			],
		});
	}
}
