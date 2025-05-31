// Copyright (c) Mysten Labs, Inc.
// Copyright (c) The Social Proof Foundation, LLC.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from 'vitest';

import { isValidMysNSName, normalizeMysNSName } from '../../../src/utils';

describe('isValidMysNSName', () => {
	test('valid MysNS names', () => {
		expect(isValidMysNSName('example.mys')).toBe(true);
		expect(isValidMysNSName('EXAMPLE.mys')).toBe(true);
		expect(isValidMysNSName('@example')).toBe(true);
		expect(isValidMysNSName('1.example.mys')).toBe(true);
		expect(isValidMysNSName('1@example')).toBe(true);
		expect(isValidMysNSName('a.b.c.example.mys')).toBe(true);
		expect(isValidMysNSName('A.B.c.123@Example')).toBe(true);
		expect(isValidMysNSName('1-a@1-b')).toBe(true);
		expect(isValidMysNSName('1-a.1-b.mys')).toBe(true);
		expect(isValidMysNSName('-@test')).toBe(false);
		expect(isValidMysNSName('-1@test')).toBe(false);
		expect(isValidMysNSName('test@-')).toBe(false);
		expect(isValidMysNSName('test@-1')).toBe(false);
		expect(isValidMysNSName('test@-a')).toBe(false);
		expect(isValidMysNSName('test.mys2')).toBe(false);
		expect(isValidMysNSName('.mys2')).toBe(false);
		expect(isValidMysNSName('test@')).toBe(false);
		expect(isValidMysNSName('@@')).toBe(false);
		expect(isValidMysNSName('@@test')).toBe(false);
		expect(isValidMysNSName('test@test.test')).toBe(false);
		expect(isValidMysNSName('@test.test')).toBe(false);
		expect(isValidMysNSName('#@test')).toBe(false);
		expect(isValidMysNSName('test@#')).toBe(false);
		expect(isValidMysNSName('test.#.mys')).toBe(false);
		expect(isValidMysNSName('#.mys')).toBe(false);
		expect(isValidMysNSName('@.test.sue')).toBe(false);

		expect(isValidMysNSName('hello-.mys')).toBe(false);
		expect(isValidMysNSName('hello--.mys')).toBe(false);
		expect(isValidMysNSName('hello.-mys')).toBe(false);
		expect(isValidMysNSName('hello.--mys')).toBe(false);
		expect(isValidMysNSName('hello.mys-')).toBe(false);
		expect(isValidMysNSName('hello.mys--')).toBe(false);
		expect(isValidMysNSName('hello-@mys')).toBe(false);
		expect(isValidMysNSName('hello--@mys')).toBe(false);
		expect(isValidMysNSName('hello@-mys')).toBe(false);
		expect(isValidMysNSName('hello@--mys')).toBe(false);
		expect(isValidMysNSName('hello@mys-')).toBe(false);
		expect(isValidMysNSName('hello@mys--')).toBe(false);
		expect(isValidMysNSName('hello--world@mys')).toBe(false);
	});
});

describe('normalizeMysNSName', () => {
	test('normalize MysNS names', () => {
		expect(normalizeMysNSName('example.mys')).toMatch('@example');
		expect(normalizeMysNSName('EXAMPLE.mys')).toMatch('@example');
		expect(normalizeMysNSName('@example')).toMatch('@example');
		expect(normalizeMysNSName('1.example.mys')).toMatch('1@example');
		expect(normalizeMysNSName('1@example')).toMatch('1@example');
		expect(normalizeMysNSName('a.b.c.example.mys')).toMatch('a.b.c@example');
		expect(normalizeMysNSName('A.B.c.123@Example')).toMatch('a.b.c.123@example');
		expect(normalizeMysNSName('1-a@1-b')).toMatch('1-a@1-b');
		expect(normalizeMysNSName('1-a.1-b.mys')).toMatch('1-a@1-b');

		expect(normalizeMysNSName('example.mys', 'dot')).toMatch('example.mys');
		expect(normalizeMysNSName('EXAMPLE.mys', 'dot')).toMatch('example.mys');
		expect(normalizeMysNSName('@example', 'dot')).toMatch('example.mys');
		expect(normalizeMysNSName('1.example.mys', 'dot')).toMatch('1.example.mys');
		expect(normalizeMysNSName('1@example', 'dot')).toMatch('1.example.mys');
		expect(normalizeMysNSName('a.b.c.example.mys', 'dot')).toMatch('a.b.c.example.mys');
		expect(normalizeMysNSName('A.B.c.123@Example', 'dot')).toMatch('a.b.c.123.example.mys');
		expect(normalizeMysNSName('1-a@1-b', 'dot')).toMatch('1-a.1-b.mys');
		expect(normalizeMysNSName('1-a.1-b.mys', 'dot')).toMatch('1-a.1-b.mys');

		expect(() => normalizeMysNSName('-@test')).toThrowError('Invalid MysNS name -@test');
		expect(normalizeMysNSName('1-a@1-b')).toMatchInlineSnapshot('"1-a@1-b"');
		expect(normalizeMysNSName('1-a.1-b.mys')).toMatchInlineSnapshot('"1-a@1-b"');
		expect(() => normalizeMysNSName('-@test')).toThrowError('Invalid MysNS name -@test');
		expect(() => normalizeMysNSName('-1@test')).toThrowError('Invalid MysNS name -1@test');
		expect(() => normalizeMysNSName('test@-')).toThrowError('Invalid MysNS name test@-');
		expect(() => normalizeMysNSName('test@-1')).toThrowError('Invalid MysNS name test@-1');
		expect(() => normalizeMysNSName('test@-a')).toThrowError('Invalid MysNS name test@-a');
		expect(() => normalizeMysNSName('test.mys2')).toThrowError('Invalid MysNS name test.mys2');
		expect(() => normalizeMysNSName('.mys2')).toThrowError('Invalid MysNS name .mys2');
		expect(() => normalizeMysNSName('test@')).toThrowError('Invalid MysNS name test@');
		expect(() => normalizeMysNSName('@@')).toThrowError('Invalid MysNS name @@');
		expect(() => normalizeMysNSName('@@test')).toThrowError('Invalid MysNS name @@test');
		expect(() => normalizeMysNSName('test@test.test')).toThrowError(
			'Invalid MysNS name test@test.test',
		);
		expect(() => normalizeMysNSName('@test.test')).toThrowError('Invalid MysNS name @test.test');
		expect(() => normalizeMysNSName('#@test')).toThrowError('Invalid MysNS name #@test');
		expect(() => normalizeMysNSName('test@#')).toThrowError('Invalid MysNS name test@#');
		expect(() => normalizeMysNSName('test.#.mys')).toThrowError('Invalid MysNS name test.#.mys');
		expect(() => normalizeMysNSName('#.mys')).toThrowError('Invalid MysNS name #.mys');
		expect(() => normalizeMysNSName('@.test.sue')).toThrowError('Invalid MysNS name @.test.sue');
	});
});
