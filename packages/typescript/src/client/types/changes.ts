// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import type { MysObjectChange } from './generated.js';

export type MysObjectChangePublished = Extract<MysObjectChange, { type: 'published' }>;
export type MysObjectChangeTransferred = Extract<MysObjectChange, { type: 'transferred' }>;
export type MysObjectChangeMutated = Extract<MysObjectChange, { type: 'mutated' }>;
export type MysObjectChangeDeleted = Extract<MysObjectChange, { type: 'deleted' }>;
export type MysObjectChangeWrapped = Extract<MysObjectChange, { type: 'wrapped' }>;
export type MysObjectChangeCreated = Extract<MysObjectChange, { type: 'created' }>;
