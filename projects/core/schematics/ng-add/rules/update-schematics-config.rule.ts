import { chain, Rule } from '@angular-devkit/schematics';
import { updateSchematicConfig } from '../../shared/rules';
import { RuleContext } from '../schema';
import { Schema } from '../../shared/schema';

/**
 * Update angular.json for ngx-formwork schematics
 */
export function updateSchematicsConfig(ruleContext: RuleContext): Rule {
  return () => {
    const { useHelper, helperPath, projectName, useSchematicConfig } =
      ruleContext;

    if (!useSchematicConfig) {
      return;
    }

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
