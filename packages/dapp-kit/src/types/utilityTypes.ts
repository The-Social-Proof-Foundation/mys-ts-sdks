// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<T>;
