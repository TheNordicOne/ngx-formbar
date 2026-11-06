import { isJsonObject } from '@angular-devkit/core';
import {
  chain,
  noop,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { addDependency, DependencyType } from '@schematics/angular/utility';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CORE_PACKAGE_NAME,
  SCHEMATICS_PACKAGE_NAME,
} from '../../shared/constants';
import { RuleContext } from '../schema';

const dependencySections = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
];

interface OwnManifest {
  version?: string;
  peerDependencies?: Record<string, string>;
}

export function installDependencies(ruleContext: RuleContext): Rule {
  return chain([
    installPackage(CORE_PACKAGE_NAME, DependencyType.Default, coreRange),
    ruleContext.installSchematics === false
      ? noop()
      : installPackage(
          SCHEMATICS_PACKAGE_NAME,
          DependencyType.Dev,
          schematicsRange,
        ),
    (_tree: Tree, context: SchematicContext) => {
      context.logger.info('✅ ngx-formbar has been set up successfully!');
    },
  ]);
}

function installPackage(
  packageName: string,
  type: DependencyType,
  range: () => string,
) {
  return (tree: Tree, context: SchematicContext) => {
    if (isDeclared(tree, packageName)) {
      return noop();
    }

    context.logger.info(`📦 Installing ${packageName}...`);

    return addDependency(packageName, range(), { type });
  };
}

/** Not `getDependency`, as `@schematics/angular` only has it from 20.2. */
function isDeclared(tree: Tree, packageName: string) {
  const manifest = tree.readJson('/package.json');

  return (
    isJsonObject(manifest) &&
    dependencySections.some((section) => {
      const dependencies = manifest[section];

      return isJsonObject(dependencies) && packageName in dependencies;
    })
  );
}

/** The release writes the range of the matching core into the peer dependencies. */
function coreRange() {
  return requiredRange(
    CORE_PACKAGE_NAME,
    ownManifest().peerDependencies?.[CORE_PACKAGE_NAME],
  );
}

/** All packages of this repository are released under one version. */
function schematicsRange() {
  return `^${requiredRange(SCHEMATICS_PACKAGE_NAME, ownManifest().version)}`;
}

function requiredRange(packageName: string, range: string | undefined) {
  if (!range) {
    throw new SchematicsException(
      `Could not read the version range of ${packageName} from the manifest of @ngx-formbar/reactive-forms.`,
    );
  }

  return range;
}

function ownManifest() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const manifest: OwnManifest = JSON.parse(
    readFileSync(join(__dirname, '../package.json'), 'utf8'),
  );

  return manifest;
}
