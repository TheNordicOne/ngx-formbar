import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  CORE_PACKAGE_NAME,
  SCHEMATICS_PACKAGE_NAME,
} from '../../shared/constants';
import { RuleContext } from '../schema';

export function installDependencies(ruleContext: RuleContext): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    context.addTask(
      new NodePackageInstallTask({ packageName: CORE_PACKAGE_NAME }),
    );
    context.logger.info(`📦 Installing ${CORE_PACKAGE_NAME}...`);

    installSchematicsPackage(ruleContext, context);

    context.logger.info('✅ ngx-formbar has been set up successfully!');
  };
}

function installSchematicsPackage(
  ruleContext: RuleContext,
  context: SchematicContext,
) {
  if (ruleContext.installSchematics === false) {
    return;
  }

  context.addTask(
    new NodePackageInstallTask({ packageName: SCHEMATICS_PACKAGE_NAME }),
  );
  context.logger.info(`📦 Installing ${SCHEMATICS_PACKAGE_NAME}...`);
}
