import { Tree } from '@angular-devkit/schematics';
import {
  DEFAULT_REGISTRATION_TYPE,
  DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  DEFAULT_SCHEMATICS_CONFIG_PATH,
  isWithin,
  joinToSourceRoot,
  NgxFormbarAutomationConfig,
  readSchematicsConfig,
  resolveWithinWorkspace,
  SHARED_SCHEMATICS_CONFIG,
  sourceRootValue,
} from '@ngx-formbar/setup';
import { posix } from 'node:path';
import {
  DEFAULT_REGISTRATIONS_FILE,
  generatorDefaults,
  GeneratorDefaults,
} from './helper';
import { RuleContext } from './schema';
import {
  DEFAULT_CONTENT_TYPE_EXPORT_NAME,
  DEFAULT_CONTENT_TYPE_FILE_NAME,
  DEFAULT_CONTENT_TYPE_PATH,
} from '../shared/constants';

export const SHARED_CONFIG_FILE = SHARED_SCHEMATICS_CONFIG;

/** What a setting means when neither this run nor the file states it. */
const UNSTATED: Required<GeneratorDefaults> = {
  registrationType: DEFAULT_REGISTRATION_TYPE,
  controlRegistrationsPath: DEFAULT_REGISTRATIONS_FILE,
  viewProviderHelperPath: 'none',
};
/** How a file overrides the shared file with what this run leaves unstated. */
const REMOVED_OR_STATED = { ...UNSTATED, viewProviderHelperPath: null };
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

export const OWN_SCHEMATICS_CONFIG = `${DEFAULT_SCHEMATICS_CONFIG_PATH}/${DEFAULT_SCHEMATIC_CONFIG_FILE_NAME}`;

/** Where the lookup looks first in a project. */
export function ownSchematicsConfigFile({ sourceRoot }: RuleContext): string {
  return joinToSourceRoot(OWN_SCHEMATICS_CONFIG, sourceRoot);
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
 * another location. A project's own file goes over the shared one, so that is
 * where settings go that differ from the shared file.
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

/** The `schema.type` this run seeds its content union for. */
export function seededUnionType(sourceRoot: string): string {
  return `${sourceRootValue(joinToSourceRoot(`${DEFAULT_CONTENT_TYPE_PATH}/${DEFAULT_CONTENT_TYPE_FILE_NAME}.ts`, sourceRoot), sourceRoot)}#${DEFAULT_CONTENT_TYPE_EXPORT_NAME}`;
}

/**
 * What the file of this run says about the content union: `unset` for a kept
 * file without `schema.type`. A file this run writes names this union.
 */
export function keptConfigUnion(
  tree: Tree,
  ruleContext: RuleContext,
  union: string,
): 'unset' | 'this' | 'other' {
  const file = schematicsConfigFile(tree, ruleContext);
  const type = readSchematicsConfig(tree, file)?.schema?.type;

  return !type
    ? tree.exists(file)
      ? 'unset'
      : 'this'
    : resolveWithinWorkspace(type.split('#')[0], ruleContext.sourceRoot) ===
        union
      ? 'this'
      : 'other';
}

/** The settings of this run that a kept file does not hold, as `name: value`. */
export function ignoredSettings(
  tree: Tree,
  file: string,
  ruleContext: RuleContext,
): string[] {
  const defaults = generatorDefaults(ruleContext);

  return tree.exists(file)
    ? differingSettings(readSchematicsConfig(tree, file), ruleContext).map(
        (setting) => `${setting}: ${defaults[setting] ?? UNSTATED[setting]}`,
      )
    : [];
}

/** What a new file over the shared one has to state. */
export function settingsOverShared(
  tree: Tree,
  ruleContext: RuleContext,
  { schema }: NgxFormbarAutomationConfig,
): object {
  const shared = readSchematicsConfig(tree, SHARED_CONFIG_FILE);
  const defaults = generatorDefaults(ruleContext);

  return {
    ...Object.fromEntries(
      differingSettings(shared, ruleContext).map((setting) => [
        setting,
        defaults[setting] ?? REMOVED_OR_STATED[setting],
      ]),
    ),
    ...(shared?.schema?.type
      ? {}
      : { schema: shared?.schema?.emitters ? { type: schema?.type } : schema }),
  };
}

/** What a file does not state and a new shared file would set for it. */
export function settingsLostToNewShared(
  tree: Tree,
  file: string,
  stated: GeneratorDefaults,
): [string, string | null][] {
  const kept = readSchematicsConfig(tree, file);

  return SETTINGS.filter(
    (setting) => kept?.[setting] === undefined && stated[setting] !== undefined,
  ).map((setting) => [setting, REMOVED_OR_STATED[setting]]);
}

function differingSettings(
  kept: NgxFormbarAutomationConfig | null,
  ruleContext: RuleContext,
) {
  const defaults = generatorDefaults(ruleContext);

  return SETTINGS.filter(
    (setting) =>
      !isSameSetting(
        setting,
        kept?.[setting] ?? UNSTATED[setting],
        defaults[setting] ?? UNSTATED[setting],
        ruleContext.sourceRoot,
      ),
  );
}

function isSameSetting(
  setting: keyof GeneratorDefaults,
  kept: string,
  stated: string,
  sourceRoot: string,
) {
  return (
    kept === stated ||
    (setting !== 'registrationType' &&
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
        isWithin(resolvedKept.slice(1), resolvedStated)))
  );
}
