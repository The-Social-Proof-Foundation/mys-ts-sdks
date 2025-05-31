// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type {
	Checkpoint,
	DynamicFieldInfo,
	MysCallArg,
	MysMoveNormalizedModule,
	MysParsedData,
	MysTransaction,
	MysValidatorSummary,
} from './generated.js';

export type ResolvedNameServiceNames = {
	data: string[];
	hasNextPage: boolean;
	nextCursor: string | null;
};

export type EpochInfo = {
	epoch: string;
	validators: MysValidatorSummary[];
	epochTotalTransactions: string;
	firstCheckpointId: string;
	epochStartTimestamp: string;
	endOfEpochInfo: EndOfEpochInfo | null;
	referenceGasPrice: number | null;
};

export type EpochMetrics = {
	epoch: string;
	epochTotalTransactions: string;
	firstCheckpointId: string;
	epochStartTimestamp: string;
	endOfEpochInfo: EndOfEpochInfo | null;
};

export type EpochPage = {
	data: EpochInfo[];
	nextCursor: string | null;
	hasNextPage: boolean;
};

export type EpochMetricsPage = {
	data: EpochMetrics[];
	nextCursor: string | null;
	hasNextPage: boolean;
};

export type EndOfEpochInfo = {
	lastCheckpointId: string;
	epochEndTimestamp: string;
	protocolVersion: string;
	referenceGasPrice: string;
	totalStake: string;
	storageFundReinvestment: string;
	storageCharge: string;
	storageRebate: string;
	storageFundBalance: string;
	stakeSubsidyAmount: string;
	totalGasFees: string;
	totalStakeRewardsDistributed: string;
	leftoverStorageFundInflow: string;
};

export type CheckpointPage = {
	data: Checkpoint[];
	nextCursor: string | null;
	hasNextPage: boolean;
};

export type NetworkMetrics = {
	currentTps: number;
	tps30Days: number;
	currentCheckpoint: string;
	currentEpoch: string;
	totalAddresses: string;
	totalObjects: string;
	totalPackages: string;
};

export type AddressMetrics = {
	checkpoint: number;
	epoch: number;
	timestampMs: number;
	cumulativeAddresses: number;
	cumulativeActiveAddresses: number;
	dailyActiveAddresses: number;
};

export type AllEpochsAddressMetrics = AddressMetrics[];

export type MoveCallMetrics = {
	rank3Days: MoveCallMetric[];
	rank7Days: MoveCallMetric[];
	rank30Days: MoveCallMetric[];
};

export type MoveCallMetric = [
	{
		module: string;
		package: string;
		function: string;
	},
	string,
];

export type DynamicFieldPage = {
	data: DynamicFieldInfo[];
	nextCursor: string | null;
	hasNextPage: boolean;
};

export type MysMoveNormalizedModules = Record<string, MysMoveNormalizedModule>;

export type MysMoveObject = Extract<MysParsedData, { dataType: 'moveObject' }>;
export type MysMovePackage = Extract<MysParsedData, { dataType: 'package' }>;

export type ProgrammableTransaction = {
	transactions: MysTransaction[];
	inputs: MysCallArg[];
};
