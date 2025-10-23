import { beforeEach, describe } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

import { Schema as GenerateOptions } from '../shared/schema';
import { COLLECTION_PATH, setupWorkspace } from './workspace-setup';
import { app } from './helper';

const appConfigPathRaw = 'app.config.ts';
const formworkConfigPath = 'app/formwork.config.ts';
const registrationsPath = 'app/registrations/component-registrations.ts';

describe('control schematic', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;

  const baseOptions: GenerateOptions = {
    project: 'test-app',
    key: 'test',
  };

  const appConfigPath = app(appConfigPathRaw);

  async function runSchematic(options: Partial<GenerateOptions> = {}) {
    return runner.runSchematic(
      'register',
      { ...baseOptions, ...options },
      appTree,
    );
  }

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    appTree = await setupWorkspace(runner);
  });
});
