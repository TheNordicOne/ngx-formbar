import { isJsonObject } from '@angular-devkit/core';
import { Tree } from '@angular-devkit/schematics';
import {
  DEFAULT_REGISTRATION_TYPE,
  DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  DEFAULT_SCHEMATICS_CONFIG_PATH,
  joinToSourceRoot,
} from '@ngx-formbar/setup';
import { posix } from 'node:path';
import {
  DEFAULT_REGISTRATIONS_FILE,
  generatorDefaults,
  GeneratorDefaults,
} from './helper';
import { RuleContext } from './schema';

const SHARED_CONFIG_FILE = `/${DEFAULT_SCHEMATIC_CONFIG_FILE_NAME}`;

/** What a setting means when neither this run nor the file states it. */
const UNSTATED: Required<GeneratorDefaults> = {
  registrationType: DEFAULT_REGISTRATION_TYPE,
  controlRegistrationsPath: DEFAULT_REGISTRATIONS_FILE,
  viewProviderHelperPath: 'none',
};
const SETTINGS: (keyof GeneratorDefaults)[] = [
  'registrationType',
  'controlRegistrationsPath',
  'viewProviderHelperPath',
];

export function requestedSchematicsConfigFile({
  schematicsConfigDirectory,
  schematicConfigFileName,
}: RuleContext): string {
  return posix.join(
    schematicsConfigDirectory,
    `${schematicConfigFileName}.json`,
  );
}

/**
 * The file holding the settings of this run. The lookup prefers a project's own
 * file and does not merge it with the shared one, so that is where settings go
 * that differ from the shared file.
 */
export function schematicsConfigFile(
  tree: Tree,
  ruleContext: RuleContext,
): string {
  const requested = requestedSchematicsConfigFile(ruleContext);

  return requested === SHARED_CONFIG_FILE &&
    ignoredSettings(tree, requested, ruleContext).length > 0
    ? joinToSourceRoot(
        `${DEFAULT_SCHEMATICS_CONFIG_PATH}/${DEFAULT_SCHEMATIC_CONFIG_FILE_NAME}`,
        ruleContext.projectRoot,
      )
    : requested;
}

/** The settings of this run that a kept file does not hold, as `name: value`. */
export function ignoredSettings(
  tree: Tree,
  file: string,
  ruleContext: RuleContext,
): string[] {
  const kept = tree.exists(file) ? tree.readJson(file) : null;

  if (!isJsonObject(kept)) {
    return [];
  }

  const defaults = generatorDefaults(ruleContext);

  return SETTINGS.filter(
    (setting) =>
      (kept[setting] ?? UNSTATED[setting]) !==
      (defaults[setting] ?? UNSTATED[setting]),
  ).map((setting) => `${setting}: ${defaults[setting] ?? UNSTATED[setting]}`);
}
