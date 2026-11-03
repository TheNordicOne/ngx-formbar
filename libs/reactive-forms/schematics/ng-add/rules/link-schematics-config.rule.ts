import { Rule } from '@angular-devkit/schematics';
import { findSchematicsConfig, sourceRootValue } from '@ngx-formbar/setup';

import { RuleContext } from '../schema';
import { removeSchematicsConfigLink, updateSchematicConfigs } from '../helper';
import {
  linkedSchematicsConfigFile,
  schematicsConfigFile,
} from '../schematics-config-file';
import { SCHEMATICS_GENERATORS } from '../../shared/constants';

/**
 * Sets `schematicsConfig` on every generator when the lookup would not find the
 * schematics configuration file of this run. A link to another file goes, with a
 * warning, as it would point past the file the generators are meant to use.
 */
export function linkSchematicsConfig(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const {
      useSchematicConfig,
      projectName,
      sourceRoot,
      schematicsConfigLink,
    } = ruleContext;

    const configFilePath = schematicsConfigFile(tree, ruleContext);
    const found = findSchematicsConfig(tree, sourceRoot);

    if (
      useSchematicConfig &&
      linkedSchematicsConfigFile(tree, ruleContext) === configFilePath
    ) {
      return;
    }

    if (!useSchematicConfig || found === configFilePath) {
      if (schematicsConfigLink) {
        context.logger.warn(
          `Removed the schematicsConfig link to ${schematicsConfigLink} from angular.json, as ${useSchematicConfig ? `the generators find ${configFilePath} without it` : 'this run uses no schematics configuration file'}.`,
        );
      }

      return removeSchematicsConfigLink(SCHEMATICS_GENERATORS, projectName);
    }

    const configPath = sourceRootValue(configFilePath, sourceRoot);

    context.logger.info(
      `Pointing the generators at ${configPath}, ${found ? `as they would find ${found} first` : 'where they would not find it'}`,
    );

    return updateSchematicConfigs(
      Object.fromEntries(
        SCHEMATICS_GENERATORS.map((generator) => [
          generator,
          { schematicsConfig: configPath },
        ]),
      ),
      projectName,
    );
  };
}
