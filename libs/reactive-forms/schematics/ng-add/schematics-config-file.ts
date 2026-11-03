import { isJsonObject, JsonValue } from '@angular-devkit/core';
import { Tree } from '@angular-devkit/schematics';
import {
  DEFAULT_REGISTRATION_TYPE,
  DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  DEFAULT_SCHEMATICS_CONFIG_PATH,
  isWithin,
  joinToSourceRoot,
  resolveWithinWorkspace,
} from '@ngx-formbar/setup';
import { posix } from 'node:path';
import {
  DEFAULT_REGISTRATIONS_FILE,
  generatorDefaults,
  GeneratorDefaults,
} from './helper';
import { RuleContext } from './schema';

export const SHARED_CONFIG_FILE = `/${DEFAULT_SCHEMATIC_CONFIG_FILE_NAME}`;

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

/** Where the lookup looks first in a project. */
export function ownSchematicsConfigFile({ sourceRoot }: RuleContext): string {
  return joinToSourceRoot(
    `${DEFAULT_SCHEMATICS_CONFIG_PATH}/${DEFAULT_SCHEMATIC_CONFIG_FILE_NAME}`,
    sourceRoot,
  );
}

/** Where `schematicsConfig` in angular.json points, if that file exists. */
export function linkedSchematicsConfigFile(
  tree: Tree,
  { schematicsConfigLink, sourceRoot }: RuleContext,
): string | null {
  const linked = schematicsConfigLink
    ? resolveWithinWorkspace(schematicsConfigLink, sourceRoot)
    : null;

  return linked && tree.exists(linked) ? linked : null;
}

/**
 * The file holding the settings of this run. A link stays unless the run names
 * another location. The lookup prefers a project's own
 * file and does not merge it with the shared one, so that is where settings go
 * that differ from the shared file.
 */
export function schematicsConfigFile(
  tree: Tree,
  ruleContext: RuleContext,
): string {
  const requested = requestedSchematicsConfigFile(ruleContext);
  const own = ownSchematicsConfigFile(ruleContext);
  const linked = ruleContext.schematicsConfigNamed
    ? null
    : linkedSchematicsConfigFile(tree, ruleContext);
  const keepsSharedDefault =
    !ruleContext.schematicsConfigNamed &&
    !tree.exists(own) &&
    tree.exists(SHARED_CONFIG_FILE);

  return (
    linked ??
    (requested === SHARED_CONFIG_FILE || keepsSharedDefault
      ? ignoredSettings(tree, SHARED_CONFIG_FILE, ruleContext).length > 0
        ? own
        : SHARED_CONFIG_FILE
      : requested)
  );
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
  const stated = (setting: keyof GeneratorDefaults) =>
    defaults[setting] ?? UNSTATED[setting];

  return SETTINGS.filter(
    (setting) =>
      !isSameSetting(
        setting,
        kept[setting] ?? UNSTATED[setting],
        stated(setting),
        ruleContext.sourceRoot,
      ),
  ).map((setting) => `${setting}: ${stated(setting)}`);
}

/** The top-level settings of `shared` that `own` does not repeat. */
export function settingsStoppingToApply(
  tree: Tree,
  shared: string,
  own: object,
): string[] {
  const kept = tree.readJson(shared);
  const ownEntries = new Map(Object.entries(own));

  return isJsonObject(kept)
    ? Object.keys(kept).filter(
        (setting) =>
          JSON.stringify(kept[setting]) !==
          JSON.stringify(ownEntries.get(setting)),
      )
    : [];
}

function isSameSetting(
  setting: keyof GeneratorDefaults,
  kept: JsonValue,
  stated: string,
  sourceRoot: string,
) {
  return (
    kept === stated ||
    (setting !== 'registrationType' &&
      typeof kept === 'string' &&
      stated !== UNSTATED.viewProviderHelperPath &&
      isSamePath(setting, kept, stated, sourceRoot))
  );
}

function isSamePath(
  setting: keyof GeneratorDefaults,
  kept: string,
  stated: string,
  sourceRoot: string,
) {
  const [keptPath] = kept.split('#');
  const resolvedKept = resolveWithinWorkspace(keptPath, sourceRoot);
  const resolvedStated = resolveWithinWorkspace(stated, sourceRoot);

  return (
    !!resolvedKept &&
    !!resolvedStated &&
    (resolvedKept === resolvedStated ||
      (setting === 'viewProviderHelperPath' &&
        keptPath.endsWith('.ts') &&
        isWithin(resolvedKept.slice(1), resolvedStated.slice(1))))
  );
}
