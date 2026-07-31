import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { COLLECTION_PATH, setupWorkspace } from './workspace-setup';
import { readCompilerOptions } from '../schema/program';

const TS_CONFIG_PATH = 'projects/test-app/tsconfig.app.json';

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

    expect(options.baseUrl).toBe('/projects/test-app');
    expect(options.typeRoots).toEqual(['/node_modules/@types']);
  });

  it('falls back to defaults when the tsconfig is missing', () => {
    const options = readCompilerOptions(tree, 'projects/test-app/absent.json');

    expect(options.strict).toBe(true);
    expect(options.baseUrl).toBeUndefined();
  });
});
