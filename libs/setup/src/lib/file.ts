import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { logging } from '@angular-devkit/core';
import {
  DEFAULT_COMPONENT_REGISTRATIONS_FILE_NAME,
  DEFAULT_REGISTRATIONS_PATH,
  DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  DEFAULT_SCHEMATICS_CONFIG_PATH,
} from './constants';
import { NgxFormbarAutomationConfig } from './shared-config.type';
import { joinToSourceRoot, resolveWithinWorkspace } from './source-root-path';

function findConfigPath(tree: Tree, sourceRoot: string) {
  const candidates = [
    `${DEFAULT_REGISTRATIONS_PATH}/${DEFAULT_COMPONENT_REGISTRATIONS_FILE_NAME}`,
    'app/formbar.config.ts',
    'app/app.config.ts',
  ].map((path) => joinToSourceRoot(path, sourceRoot));

  return candidates.find((p) => tree.exists(p)) ?? null;
}

/**
 * A configured registrations file follows `resolveFromSourceRoot`, and is `null`
 * above the workspace root. Without one, the default locations are searched.
 */
export function resolveRegistrationsPath(
  tree: Tree,
  sourceRoot: string,
  configuredPath: string | null | undefined,
): string | null {
  return configuredPath
    ? resolveWithinWorkspace(configuredPath, sourceRoot)
    : findConfigPath(tree, sourceRoot);
}

export function registrationsNotFoundMessage(path: string): string {
  return `Registration file ${path} could not be found. Skipping registration.`;
}

export function registrationsMissingMessage(path: string): string {
  return `Registration file ${path} holds no component registrations. Skipping registration.`;
}

/**
 * The schematics configuration file of a project: the `app` folder in its source root, or
 * else the workspace root. A config elsewhere needs `schematicsConfig`.
 */
function schematicsConfigLocations(sourceRoot: string) {
  return [
    joinToSourceRoot(
      `${DEFAULT_SCHEMATICS_CONFIG_PATH}/${DEFAULT_SCHEMATIC_CONFIG_FILE_NAME}`,
      sourceRoot,
    ),
    `/${DEFAULT_SCHEMATIC_CONFIG_FILE_NAME}`,
  ];
}

export function findSchematicsConfig(
  tree: Tree,
  sourceRoot: string,
): string | null {
  return (
    schematicsConfigLocations(sourceRoot).find((path) => tree.exists(path)) ??
    null
  );
}

/**
 * Reads `formbar-schematic.config.json` and logs which file that was. An
 * explicit `--schematicsConfig` follows `resolveFromSourceRoot` and must exist.
 * Without one, see `findSchematicsConfig`.
 */
export function loadAutomationConfig(
  tree: Tree,
  sourceRoot: string,
  logger: logging.LoggerApi,
  configOption?: string,
): NgxFormbarAutomationConfig | null {
  const configPath = configOption
    ? resolveExplicitConfig(tree, sourceRoot, configOption)
    : findSchematicsConfig(tree, sourceRoot);

  logger.info(
    configPath
      ? `Using schematics configuration file ${configPath}`
      : `No schematics configuration file found. Looked for ${schematicsConfigLocations(sourceRoot).join(' and ')}`,
  );

  return readFile<NgxFormbarAutomationConfig | null>(tree, configPath);
}

function resolveExplicitConfig(
  tree: Tree,
  sourceRoot: string,
  configOption: string,
) {
  const path = resolveWithinWorkspace(configOption, sourceRoot);

  if (!path || !tree.exists(path)) {
    throw new SchematicsException(
      `Schematics configuration file not found: ${path ?? configOption}`,
    );
  }

  return path;
}

function readFile<T>(tree: Tree, path?: string | null): T | null {
  if (!path) {
    return null;
  }
  if (!tree.exists(path)) {
    return null;
  }
  const buf = tree.read(path);
  if (!buf) {
    throw new SchematicsException(`Could not read ${path}`);
  }

  const text = buf.toString('utf-8');

  return JSON.parse(text) as T;
}
