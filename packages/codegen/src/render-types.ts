// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { normalizeSuiAddress } from '@mysten/sui/utils';

import type { DeserializedModule, TypeSignature } from './types.js';

const MOVE_STDLIB_ADDRESS = normalizeSuiAddress('0x1');
const SUI_FRAMEWORK_ADDRESS = normalizeSuiAddress('0x2');

type TypeSignatureFormat = 'typescriptArg' | 'bcs' | 'typeTag';
interface RenderTypeSignatureOptions {
	format: TypeSignatureFormat;
	moduleDef: DeserializedModule;
	onDependency?: (address: string, name: string) => void;
	onTypeParameter?: (typeParameter: number) => void;
}

export function renderTypeSignature(
	type: TypeSignature,
	options: RenderTypeSignatureOptions,
): string {
	switch (type) {
		case 'Address':
			switch (options.format) {
				case 'typescriptArg':
					return 'string';
				case 'typeTag':
					return `address`;
				case 'bcs':
					return 'bcs.Address';
				default:
					throw new Error(`Unknown format: ${options.format}`);
			}
		case 'Bool':
			switch (options.format) {
				case 'typescriptArg':
					return 'boolean';
				case 'typeTag':
					return `bool`;
				case 'bcs':
					return 'bcs.bool()';
				default:
					throw new Error(`Unknown format: ${options.format}`);
			}
		case 'U8':
		case 'U16':
		case 'U32':
			switch (options.format) {
				case 'typescriptArg':
					return 'number';
				case 'typeTag':
					return type.toLowerCase();
				case 'bcs':
					return `bcs.${type.toLowerCase()}()`;
				default:
					throw new Error(`Unknown format: ${options.format}`);
			}
		case 'U64':
		case 'U128':
		case 'U256':
			switch (options.format) {
				case 'typescriptArg':
					return `number | bigint`;
				case 'typeTag':
					return type.toLowerCase();
				case 'bcs':
					return `bcs.${type.toLowerCase()}()`;
				default:
					throw new Error(`Unknown format: ${options.format}`);
			}
	}

	if ('Datatype' in type) {
		return renderDataType(type.Datatype, options);
	}

	if ('DatatypeInstantiation' in type) {
		const [datatype, typeParameters] = type.DatatypeInstantiation;
		return renderDataType(datatype, options, typeParameters);
	}

	if ('Reference' in type) {
		return renderTypeSignature(type.Reference, options);
	}

	if ('MutableReference' in type) {
		return renderTypeSignature(type.MutableReference, options);
	}

	if ('Vector' in type) {
		switch (options.format) {
			case 'typescriptArg':
				return `${renderTypeSignature(type.Vector, options)}[]`;
			case 'typeTag':
				return `vector<${renderTypeSignature(type.Vector, options)}>`;
			case 'bcs':
				return `bcs.vector(${renderTypeSignature(type.Vector, options)})`;
			default:
				throw new Error(`Unknown format: ${options.format}`);
		}
	}

	if ('TypeParameter' in type) {
		options.onTypeParameter?.(type.TypeParameter);
		switch (options.format) {
			case 'typescriptArg':
				return `T${type.TypeParameter}`;
			case 'typeTag':
				return `\${options.typeArguments[${type.TypeParameter}]}`;
			case 'bcs':
				return `typeParameters[${type.TypeParameter}]`;
			default:
				throw new Error(`Unknown format: ${options.format}`);
		}
	}

	throw new Error(`Unknown type signature: ${JSON.stringify(type, null, 2)}`);
}

export function isPureSignature(type: TypeSignature, options: RenderTypeSignatureOptions): boolean {
	if (typeof type === 'string') {
		return true;
	}

	if ('Reference' in type) {
		return isPureSignature(type.Reference, options);
	}

	if ('MutableReference' in type) {
		return isPureSignature(type.MutableReference, options);
	}

	if ('Datatype' in type) {
		return isPureDataType(type.Datatype, options);
	}

	if ('DatatypeInstantiation' in type) {
		return isPureDataType(type.DatatypeInstantiation[0], options);
	}

	if ('Vector' in type) {
		return isPureSignature(type.Vector, options);
	}

	if ('TypeParameter' in type) {
		return false;
	}

	throw new Error(`Unknown type signature: ${JSON.stringify(type, null, 2)}`);
}

function isPureDataType(type: number, options: RenderTypeSignatureOptions) {
	const handle = options.moduleDef.datatype_handles[type];
	const typeName = options.moduleDef.identifiers[handle.name];

	const moduleHandle = options.moduleDef.module_handles[handle.module];
	const moduleAddress = normalizeSuiAddress(
		options.moduleDef.address_identifiers[moduleHandle.address],
	);
	const moduleName = options.moduleDef.identifiers[moduleHandle.name];

	if (moduleAddress === MOVE_STDLIB_ADDRESS) {
		if ((moduleName === 'ascii' || moduleName === 'string') && typeName === 'String') {
			return true;
		}

		if (moduleName === 'option' && typeName === 'Option') {
			return true;
		}
	}

	if (moduleAddress === SUI_FRAMEWORK_ADDRESS) {
		if (moduleName === 'object' && typeName === 'ID') {
			return true;
		}
	}

	return false;
}

function renderDataType(
	type: number,
	options: RenderTypeSignatureOptions,
	typeParameters: TypeSignature[] = [],
): string {
	const handle = options.moduleDef.datatype_handles[type];
	const typeName = options.moduleDef.identifiers[handle.name];

	const moduleHandle = options.moduleDef.module_handles[handle.module];
	const moduleAddress = normalizeSuiAddress(
		options.moduleDef.address_identifiers[moduleHandle.address],
	);
	const moduleName = options.moduleDef.identifiers[moduleHandle.name];

	if (options.format === 'typeTag') {
		if (typeParameters.length === 0) {
			// eslint-disable-next-line no-template-curly-in-string
			return `${moduleAddress === normalizeSuiAddress('0x0') ? '${packageAddress}' : moduleAddress}::${moduleName}::${typeName}`;
		}

		// eslint-disable-next-line no-template-curly-in-string
		return `${moduleAddress === normalizeSuiAddress('0x0') ? '${packageAddress}' : moduleAddress}::${moduleName}::${typeName}<${typeParameters.map((type) => renderTypeSignature(type, options)).join(', ')}>`;
	}

	if (moduleAddress === MOVE_STDLIB_ADDRESS) {
		if ((moduleName === 'ascii' || moduleName === 'string') && typeName === 'String') {
			switch (options.format) {
				case 'typescriptArg':
					return 'string';
				case 'bcs':
					return 'bcs.string()';
				default:
					throw new Error(`Unknown format: ${options.format}`);
			}
		}

		if (moduleName === 'option' && typeName === 'Option') {
			switch (options.format) {
				case 'typescriptArg':
					if (isPureDataType(type, options)) {
						return `${renderTypeSignature(typeParameters[0], options)} | null`;
					}
					break;
				case 'bcs':
					return `bcs.option(${renderTypeSignature(typeParameters[0], options)})`;
				default:
					throw new Error(`Unknown format: ${options.format}`);
			}
		}
	}

	if (moduleAddress === SUI_FRAMEWORK_ADDRESS) {
		if (moduleName === 'object' && typeName === 'ID') {
			switch (options.format) {
				case 'typescriptArg':
					return 'string';
				case 'bcs':
					return 'bcs.Address';
				default:
					throw new Error(`Unknown format: ${options.format}`);
			}
		}
	}

	const typeNameRef =
		handle.module === options.moduleDef.self_module_handle_idx
			? typeName
			: `${getSafeName(moduleName)}.${typeName}`;

	if (handle.module !== options.moduleDef.self_module_handle_idx) {
		options.onDependency?.(moduleAddress, moduleName);
	}

	const filteredTypeParameters = typeParameters.filter(
		(_type, i) => !handle.type_parameters[i].is_phantom,
	);

	switch (options.format) {
		case 'typescriptArg':
			return 'string';
		case 'bcs':
			return `${typeNameRef}(
                ${filteredTypeParameters.map((type) => renderTypeSignature(type, options)).join(', ')})`;
		default:
			throw new Error(`Unknown format: ${options.format}`);
	}
}

const JS_RESERVED_NAMES = [
	'new',
	'delete',
	'class',
	'function',
	'import',
	'export',
	'return',
	'this',
	'super',
	'arguments',
	'eval',
	'void',
	'typeof',
	'instanceof',
	'delete',
	'in',
	'from',
	'of',
	'as',
	'async',
	'await',
	'break',
	'case',
	'catch',
	'continue',
	'debugger',
	'default',
	'do',
	'else',
	'finally',
	'for',
	'function',
	'if',
	'import',
	'in',
	'instanceof',
	'new',
	'return',
	'switch',
	'throw',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield',
	'package',
];

export function getSafeName(name: string) {
	return JS_RESERVED_NAMES.includes(name) ? `_${name}` : name;
}
