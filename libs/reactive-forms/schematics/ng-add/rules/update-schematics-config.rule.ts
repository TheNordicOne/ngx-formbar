import { Rule } from '@angular-devkit/schematics';
import { findSchematicsConfig } from '@ngx-formbar/setup';

import { RuleContext } from '../schema';
import { generatorDefaults, updateSchematicConfigs } from '../helper';
import { SCAFFOLD_GENERATORS } from '../../shared/constants';

/**
 * Without a schematics configuration file, its settings become generator defaults in
 * angular.json.
 */
export function updateSchematicsConfig(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const { projectName, projectRoot, useSchematicConfig } = ruleContext;

    if (useSchematicConfig) {
      return;
    }

    context.logger.info('Updating schematics configuration');

    const overridingConfig = findSchematicsConfig(tree, projectRoot);

    if (overridingConfig) {
      context.logger.warn(
        `${overridingConfig} overrides the settings written to angular.json, as the generators prefer a schematics configuration file.`,
      );
    }

    const defaults = generatorDefaults(ruleContext);

    return updateSchematicConfigs(
      {
        ...Object.fromEntries(
          SCAFFOLD_GENERATORS.map((generator) => [generator, defaults]),
        ),
        register: {
          registrationType: defaults.registrationType,
          controlRegistrations: defaults.controlRegistrationsPath,
        },
      },
      projectName,
    );
  };
}
