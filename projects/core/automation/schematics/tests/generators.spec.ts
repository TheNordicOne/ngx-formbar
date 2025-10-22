import { beforeEach, describe, it } from 'vitest';
import {
  SchematicTestRunner,
  UnitTestTree,
} from '@angular-devkit/schematics/testing';

import { Schema as GenerateOptions } from '../shared/schema';
import { COLLECTION_PATH, setupWorkspace } from './workspace-setup';

describe('control schematic', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;

  const baseOptions: GenerateOptions = {
    project: 'test-app',
    key: 'test',
  };

  async function runSchematic(
    schematicName: 'control' | 'group' | 'block',
    options: Partial<GenerateOptions> = {},
  ) {
    return runner.runSchematic(
      schematicName,
      { ...baseOptions, ...options },
      appTree,
    );
  }

  beforeEach(async () => {
    runner = new SchematicTestRunner('schematics', COLLECTION_PATH);
    appTree = await setupWorkspace(runner);
  });

  describe('generated file content', () => {
    // Uses view provider helper if it exists
    // Uses host directive helper if it exists
    // Uses host directive helper if it exists
  });

  describe('without configuration', () => {
    // Creates a control with default values
    // Creates a control with passed values
    // Registers the created control

    it('placeholder', async () => {
      const tree = await runSchematic('control');
    });
  });

  describe('with a configuration file', () => {
    // Creates a control with values from configuration
    // overwrites values from configuration with CLI options
    // Registers the created control to default location
    // Registers the created control to configured location
    // does not register the created control if skipRegistration is set to true
    // skips registration if control registrations file is not found
  });

  describe('with configuration via angular.json', () => {});
});
