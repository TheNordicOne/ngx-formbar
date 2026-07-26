import { beforeEach, describe, expect, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';
import { COLLECTION_PATH, setupWorkspace } from './workspace-setup';

describe('schema schematic', () => {
  let runner: SchematicTestRunner;
  let tree: UnitTestTree;

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    tree = await setupWorkspace(runner);
  });

  it('fails when no type reference is configured', async () => {
    await expect(
      runner.runSchematic('schema', { project: 'test-app' }, tree),
    ).rejects.toThrow(/No content type configured/);
  });
});
