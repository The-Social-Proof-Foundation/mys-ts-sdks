// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { normalizeMysObjectId } from './mys-types.js';

export const MYS_DECIMALS = 9;
export const MIST_PER_MYS = BigInt(1000000000);

export const MOVE_STDLIB_ADDRESS = '0x1';
export const MYS_FRAMEWORK_ADDRESS = '0x2';
export const MYS_SYSTEM_ADDRESS = '0x3';
export const MYS_CLOCK_OBJECT_ID = normalizeMysObjectId('0x6');
export const MYS_SYSTEM_MODULE_NAME = 'mys_system';
export const MYS_TYPE_ARG = `${MYS_FRAMEWORK_ADDRESS}::mys::MYS`;
export const MYS_SYSTEM_STATE_OBJECT_ID: string = normalizeMysObjectId('0x5');
