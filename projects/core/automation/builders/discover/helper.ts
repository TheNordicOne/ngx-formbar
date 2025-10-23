import { NgxFormworkAutomationConfig } from '../../shared/shared-config.type';
import {
  DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  DEFAULT_SCHEMATICS_CONFIG_PATH,
} from '../../shared/constants';
import * as path from 'path';
import * as fs from 'fs';
import { BuilderContext } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { FormworkComponentInfo } from './models/component-info.model';
import { SourceFile } from 'typescript';
import { buildRelativePath } from '@schematics/angular/utility/find-module';

function findAutomationConfig(workspaceRoot: string): string | null {
  const configPath = path.join(
    workspaceRoot,
    DEFAULT_SCHEMATICS_CONFIG_PATH,
    DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  );
  if (fs.existsSync(configPath)) {
    return configPath;
  }

  const rootConfigPath = path.join(
    workspaceRoot,
    DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  );
  if (fs.existsSync(rootConfigPath)) {
    return rootConfigPath;
  }

  return searchInDirectory(workspaceRoot);
}

function searchInDirectory(dir: string): string | null {
  const configFile = path.join(dir, DEFAULT_SCHEMATIC_CONFIG_FILE_NAME);
  if (fs.existsSync(configFile)) {
    return configFile;
  }

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const subdirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(dir, entry.name));

    for (const subdir of subdirs) {
      const foundInSubdir = searchInDirectory(subdir);
      if (foundInSubdir) {
        return foundInSubdir;
      }
    }
  } catch (error) {
    console.warn(`Error searching directory ${dir}:`, error);
  }

  return null;
}

export function readAutomationConfig(
  configPathOrRoot: string,
  context: BuilderContext,
): NgxFormworkAutomationConfig | null {
  try {
    if (
      fs.existsSync(configPathOrRoot) &&
      fs.lstatSync(configPathOrRoot).isDirectory()
    ) {
      const foundPath = findAutomationConfig(configPathOrRoot);
      if (!foundPath) {
        return null;
      }
      configPathOrRoot = foundPath;
    }

    if (fs.existsSync(configPathOrRoot)) {
      const content = fs.readFileSync(configPathOrRoot, 'utf8');
      return JSON.parse(content) as NgxFormworkAutomationConfig;
    }
  } catch (error) {
    context.logger.warn(
      `Failed to read automation config from ${configPathOrRoot}:`,
      error as JsonObject,
    );
  }

  return null;
}

export function registerTypeToken(
  sourceFile: SourceFile,
  components: FormworkComponentInfo[],
  outputPath: string,
  automationConfig: NgxFormworkAutomationConfig,
) {
  for (const component of components) {
    const componentImportPath = buildRelativePath(
      outputPath,
      component.filePath,
    ).replace(/\.ts$/, '');
  }

  return true;
}

export function registerTypeMap(
  sourceFile: SourceFile,
  components: FormworkComponentInfo[],
  outputPath: string,
  automationConfig: NgxFormworkAutomationConfig,
) {
  return true;
}
