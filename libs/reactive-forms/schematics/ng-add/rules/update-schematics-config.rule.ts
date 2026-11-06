import { Rule } from '@angular-devkit/schematics';
import { findSchematicsConfig, readSchematicsConfig } from '@ngx-formbar/setup';

import { RuleContext } from '../schema';
import { generatorDefaults, updateSchematicConfigs } from '../helper';
import { SCAFFOLD_GENERATORS } from '../../shared/constants';

const OVERRIDING_SETTINGS = [
  'registrationType',
  'controlRegistrationsPath',
  'viewProviderHelperPath',
] as const;

const NG_ADD_SETTINGS = [
  'registrationType',
  'controlRegistrationsPath',
  'viewProviderHelperPath',
  'controlRegistrations',
];

/**
 * Without a schematics configuration file, its settings become generator defaults in
 * angular.json.
 */
export function updateSchematicsConfig(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const { projectName, sourceRoot, useSchematicConfig } = ruleContext;

    if (useSchematicConfig) {
      return;
    }

    context.logger.info('Updating schematics configuration');

    const overridingConfig = findSchematicsConfig(tree, sourceRoot);
    const config = readSchematicsConfig(tree, overridingConfig);
    const overridden = OVERRIDING_SETTINGS.filter(
      (setting) => config?.[setting] !== undefined,
    );

    if (overridden.length > 0) {
      context.logger.warn(
        `The schematics configuration of this project sets ${overridden.join(', ')}, which win over the settings written to angular.json.`,
      );
    }

    const defaults = generatorDefaults(ruleContext);
    const { viewProviderHelperPath: _, ...withoutHelper } = defaults;

    return updateSchematicConfigs(
      {
        ...Object.fromEntries(
          SCAFFOLD_GENERATORS.map((generator) => [
            generator,
            generator === 'block' ? withoutHelper : defaults,
          ]),
        ),
        register: withoutHelper,
      },
      projectName,
      NG_ADD_SETTINGS,
    );
  };
}
