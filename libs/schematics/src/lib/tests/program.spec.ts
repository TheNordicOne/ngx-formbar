import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { COLLECTION_PATH, setupWorkspace } from './workspace-setup';
import { readCompilerOptions } from '@ngx-formbar/setup';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTreeProgram } from '../schema/program';

const TS_CONFIG_PATH = 'projects/test-app/tsconfig.app.json';

describe('createTreeProgram', () => {
  const file = '/projects/test-app/src/app/uses-hoisted.ts';
  let tree: UnitTestTree;
  let monorepo: string;

  function writeOnDisk(path: string, content: string) {
    const full = join(monorepo, path);

    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }

  function loadedFiles() {
    return createTreeProgram(
      tree,
      '/tsconfig.json',
      [file],
      join(monorepo, 'apps/web'),
    )
      .program.getSourceFiles()
      .map(({ fileName }) => fileName);
  }

  beforeEach(async () => {
    tree = await setupWorkspace(
      new SchematicTestRunner('schematics', COLLECTION_PATH),
    );
    monorepo = mkdtempSync(join(tmpdir(), 'ngx-formbar-monorepo-'));
  });

  afterEach(() => {
    rmSync(monorepo, { recursive: true, force: true });
  });

  it('finds a package installed above the workspace root', () => {
    writeOnDisk(
      'node_modules/hoisted/package.json',
      JSON.stringify({ name: 'hoisted', types: 'index.d.ts' }),
    );
    writeOnDisk(
      'node_modules/hoisted/index.d.ts',
      "export * from 'hoisted-dependency';\n",
    );
    writeOnDisk(
      'node_modules/hoisted-dependency/package.json',
      JSON.stringify({ name: 'hoisted-dependency', types: 'index.d.ts' }),
    );
    writeOnDisk(
      'node_modules/hoisted-dependency/index.d.ts',
      'export type Hoisted = string;\n',
    );
    tree.create(file, "export { Hoisted } from 'hoisted';\n");

    expect(loadedFiles()).toEqual(
      expect.arrayContaining([
        join(monorepo, 'node_modules/hoisted/index.d.ts'),
        join(monorepo, 'node_modules/hoisted-dependency/index.d.ts'),
      ]),
    );
  });

  it('finds a path mapping pointing above the workspace root', () => {
    writeOnDisk('vendor/mapped.d.ts', 'export type Mapped = string;\n');
    tree.overwrite(
      '/tsconfig.json',
      JSON.stringify({
        compilerOptions: { paths: { mapped: ['../../vendor/mapped.d.ts'] } },
      }),
    );
    tree.create(file, "export { Mapped } from 'mapped';\n");

    expect(loadedFiles()).toContain(join(monorepo, 'vendor/mapped.d.ts'));
  });
});

describe('readCompilerOptions', () => {
  let tree: UnitTestTree;

  beforeEach(async () => {
    tree = await setupWorkspace(
      new SchematicTestRunner('schematics', COLLECTION_PATH),
    );
  });

  /**
   * The project root reaches here without a leading slash, so anything the
   * compiler options resolve against the config's directory comes out relative
   * unless the path is rooted first. Nothing else in either suite sets these
   * options, so nothing else would notice.
   */
  it('roots the paths the compiler options resolve against', () => {
    tree.overwrite(
      `/${TS_CONFIG_PATH}`,
      JSON.stringify({
        extends: '../../tsconfig.json',
        compilerOptions: {
          baseUrl: '.',
          paths: { '@app/*': ['src/app/*'] },
          typeRoots: ['../../node_modules/@types'],
        },
        include: ['src/**/*.ts'],
      }),
    );

    const options = readCompilerOptions(tree, TS_CONFIG_PATH);

    expect(options).toMatchObject({ baseUrl: '/projects/test-app' });
    expect(options.typeRoots).toEqual(['/node_modules/@types']);
  });

  it('falls back to defaults when the tsconfig is missing', () => {
    const options = readCompilerOptions(tree, 'projects/test-app/absent.json');

    expect(options.strict).toBe(true);
    expect(options).not.toHaveProperty('baseUrl');
  });
});
