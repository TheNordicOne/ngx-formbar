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

export const SHARED_SCHEMATICS_CONFIG = `/${DEFAULT_SCHEMATIC_CONFIG_FILE_NAME}`;

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
    SHARED_SCHEMATICS_CONFIG,
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
 * Reads `formbar-schematic.config.json` over the shared file and logs which files
 * those were. An explicit `--schematics-config` follows `resolveFromSourceRoot` and
 * must exist. Without one, see `findSchematicsConfig`.
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

  const overShared =
    configPath !== SHARED_SCHEMATICS_CONFIG &&
    tree.exists(SHARED_SCHEMATICS_CONFIG)
      ? ` over ${SHARED_SCHEMATICS_CONFIG}`
      : '';

  logger.info(
    configPath
      ? `Using schematics configuration file ${configPath}${overShared}`
      : `No schematics configuration file found. Looked for ${schematicsConfigLocations(sourceRoot).join(' and ')}`,
  );

  return readSchematicsConfig(tree, configPath);
}

/** The settings of a file over those of the shared file. */
export function readSchematicsConfig(
  tree: Tree,
  configPath: string | null,
): NgxFormbarAutomationConfig | null {
  const shared = readFile<Settings>(tree, SHARED_SCHEMATICS_CONFIG);
  const own =
    configPath === SHARED_SCHEMATICS_CONFIG
      ? null
      : readFile<Settings>(tree, configPath);

  return shared && own ? mergeSettings(shared, own) : (own ?? shared);
}

type Settings = Record<string, unknown>;

/**
 * JSON Merge Patch, as `own` only has to state what differs: objects merge per
 * key, anything else replaces the shared value, and `null` removes it.
 */
function mergeSettings(shared: Settings, own: Settings): Settings {
  return Object.fromEntries(
    [...new Set([...Object.keys(shared), ...Object.keys(own)])]
      .map((key): [string, unknown] => [
        key,
        key in own ? mergedValue(shared[key], own[key]) : shared[key],
      ])
      .filter(([, value]) => value !== null),
  );
}

function mergedValue(shared: unknown, own: unknown) {
  return isSettings(own)
    ? mergeSettings(isSettings(shared) ? shared : {}, own)
    : own;
}

function isSettings(value: unknown): value is Settings {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

function readFile<T>(tree: Tree, path?: string | null) {
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
