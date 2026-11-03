import {
  chain,
  noop,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
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
    (_tree: Tree, context: SchematicContext) => {
      context.addTask(
        new NodePackageInstallTask({ packageName: CORE_PACKAGE_NAME }),
      );
      context.logger.info(`📦 Installing ${CORE_PACKAGE_NAME}...`);
    },
    installSchematicsPackage(ruleContext),
    (_tree: Tree, context: SchematicContext) => {
      context.logger.info('✅ ngx-formbar has been set up successfully!');
    },
  ]);
}

function installSchematicsPackage(ruleContext: RuleContext): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (
      ruleContext.installSchematics === false ||
      getDependency(tree, SCHEMATICS_PACKAGE_NAME)
    ) {
      return noop();
    }

    context.logger.info(`📦 Installing ${SCHEMATICS_PACKAGE_NAME}...`);

    return addDependency(SCHEMATICS_PACKAGE_NAME, releasedRange(), {
      type: DependencyType.Dev,
    });
  };
}

/** All packages of this repository are released under one version. */
function releasedRange() {
  const manifest: unknown = JSON.parse(
    readFileSync(join(__dirname, '../package.json'), 'utf8'),
  );

  return typeof manifest === 'object' &&
    manifest !== null &&
    'version' in manifest
    ? `^${String(manifest.version)}`
    : 'latest';
}
