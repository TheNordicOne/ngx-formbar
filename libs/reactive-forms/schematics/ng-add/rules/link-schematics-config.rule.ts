import { Rule } from '@angular-devkit/schematics';
import { posix } from 'node:path';
import { findSchematicsConfig, sourceRootValue } from '@ngx-formbar/setup';

import { RuleContext } from '../schema';
import { removeSchematicsConfigLink, updateSchematicConfigs } from '../helper';
import { SCHEMATICS_GENERATORS } from '../../shared/constants';

/**
 * Sets `schematicsConfig` on every generator when the lookup would not find the
 * schematics configuration file ng-add wrote. Otherwise a link from an earlier run is
 * stale, as it would point past the file the generators are meant to use.
 */
export function linkSchematicsConfig(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const {
      useSchematicConfig,
      schematicsConfigDirectory,
      schematicConfigFileName,
      projectName,
      projectRoot,
    } = ruleContext;

    const configFile = `${schematicConfigFileName}.json`;
    const configFilePath = posix.join(schematicsConfigDirectory, configFile);

    if (
      !useSchematicConfig ||
      findSchematicsConfig(tree, projectRoot) === configFilePath
    ) {
      return removeSchematicsConfigLink(SCHEMATICS_GENERATORS, projectName);
    }

    const configPath = sourceRootValue(configFilePath, projectRoot);

    context.logger.info(
      `Pointing the generators at ${configPath}, where they would not find it`,
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
