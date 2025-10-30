import { chain, Rule } from '@angular-devkit/schematics';

import { RuleContext } from '../schema';
import { Schema } from '../../shared/schema';
import { updateSchematicConfig } from '../helper';

/**
 * Update angular.json for ngx-formbar schematics
 */
export function updateSchematicsConfig(ruleContext: RuleContext): Rule {
  return (_, context) => {
    const { useHelper, helperPath, projectName, useSchematicConfig } =
      ruleContext;

    if (useSchematicConfig) {
      return;
    }

    context.logger.info('Updating schematics configuration');

    const config: Partial<Schema> = {};

    if (useHelper && helperPath) {
      config.hostDirectiveHelperPath = helperPath;
      config.viewProviderHelperPath = helperPath;
    }

    return chain([
      updateSchematicConfig('control', config, projectName),
      updateSchematicConfig('group', config, projectName),
      updateSchematicConfig('block', config, projectName),
    ]);
  };
}
