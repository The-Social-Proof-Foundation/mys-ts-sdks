// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { MoveModuleBuilder } from './move-module-builder.js';

export async function generatePackage({
	source,
	destination,
	name,
}: {
	source: string;
	destination: string;
	name: string;
}) {
	const modules = (await readdir(join(source, 'build', name, 'bytecode_modules')))
		.map((mod) => join(source, 'build', name, 'bytecode_modules', mod))
		.filter((mod) => mod.endsWith('.mv'));

	const builders = await Promise.all(modules.map((mod) => MoveModuleBuilder.fromFile(mod)));

	for (const builder of builders) {
		if (!builder.hasTypesOrFunctions()) {
			continue;
		}

		builder.renderBCSTypes();
		builder.renderFunctions();
		const module = builder.moduleDef.module_handles[builder.moduleDef.self_module_handle_idx];
		await mkdir(destination, { recursive: true });
		await writeFile(
			join(destination, `${builder.moduleDef.identifiers[module.name]}.ts`),
			builder.toString('./', `./${builder.moduleDef.identifiers[module.name]}.ts`),
		);
	}

	const depsPath = join(source, 'build', name, 'bytecode_modules', 'dependencies');
	const depDirs = await readdir(depsPath);

	for (const dir of depDirs) {
		const modules = await readdir(join(depsPath, dir));

		for (const modFile of modules) {
			const builder = await MoveModuleBuilder.fromFile(join(depsPath, dir, modFile));

			if (!builder.hasBcsTypes()) {
				continue;
			}

			const module = builder.moduleDef.module_handles[builder.moduleDef.self_module_handle_idx];
			const moduleName = builder.moduleDef.identifiers[module.name];
			const moduleAddress = normalizeSuiAddress(
				builder.moduleDef.address_identifiers[module.address],
			);
			builder.renderBCSTypes();
			await mkdir(join(destination, 'deps', moduleAddress), { recursive: true });
			await writeFile(
				join(destination, 'deps', moduleAddress, `${moduleName}.ts`),
				builder.toString('./', `./deps/${moduleAddress}/${moduleName}.ts`),
			);
		}
	}
}
