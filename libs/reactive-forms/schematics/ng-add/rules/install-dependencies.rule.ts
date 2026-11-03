import {
  chain,
  noop,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { addDependency, DependencyType } from '@schematics/angular/utility';
import { getDependency } from '@schematics/angular/utility/dependency';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CORE_PACKAGE_NAME,
  SCHEMATICS_PACKAGE_NAME,
} from '../../shared/constants';
import { RuleContext } from '../schema';

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
    if (getDependency(tree, packageName)) {
      return noop();
    }

    context.logger.info(`📦 Installing ${packageName}...`);

    return addDependency(packageName, range(), { type });
  };
}

/** The release writes the range of the matching core into the peer dependencies. */
function coreRange() {
  const manifest = ownManifest();
  const peers = isRecord(manifest) ? manifest.peerDependencies : undefined;

  return readableRange(
    CORE_PACKAGE_NAME,
    isRecord(peers) ? peers[CORE_PACKAGE_NAME] : undefined,
  );
}

/** All packages of this repository are released under one version. */
function schematicsRange() {
  const manifest = ownManifest();
  const version = readableRange(
    SCHEMATICS_PACKAGE_NAME,
    isRecord(manifest) ? manifest.version : undefined,
  );

  return `^${version}`;
}

function readableRange(packageName: string, value: unknown) {
  if (typeof value !== 'string' || value === '') {
    throw new SchematicsException(
      `Could not read the version range of ${packageName} from the manifest of @ngx-formbar/reactive-forms.`,
    );
  }

  return value;
}

function ownManifest() {
  try {
    const manifest: unknown = JSON.parse(
      readFileSync(join(__dirname, '../package.json'), 'utf8'),
    );

    return manifest;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
