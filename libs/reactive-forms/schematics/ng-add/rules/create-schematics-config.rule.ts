import {
  apply,
  applyTemplates,
  mergeWith,
  move,
  Rule,
  url,
} from '@angular-devkit/schematics';
import { RuleContext } from '../schema';
import { skipExistingFiles } from './skip-existing-files.rule';
import { NgxFormbarAutomationConfig } from '@ngx-formbar/setup';
import { generatorDefaults } from '../helper';
import {
  ignoredSettings,
  schematicsConfigFile,
  seededUnionType,
  settingsOverShared,
  SHARED_CONFIG_FILE,
} from '../schematics-config-file';
import { posix } from 'node:path';

export function createSchematicsConfig(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const { useSchematicConfig, sourceRoot } = ruleContext;

    if (!useSchematicConfig) {
      return;
    }

    const configFile = schematicsConfigFile(tree, ruleContext);
    const ignored = ignoredSettings(tree, configFile, ruleContext);

    if (ignored.length > 0) {
      context.logger.warn(
        `${configFile} stays as it is, so these settings of this run are ignored: ${ignored.join(', ')}. Change them in that file.`,
      );
    }

    const schematicConfig: NgxFormbarAutomationConfig = {
      ...generatorDefaults(ruleContext),
      schema: {
        type: seededUnionType(sourceRoot),
        emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
      },
    };

    const overShared =
      configFile !== SHARED_CONFIG_FILE && tree.exists(SHARED_CONFIG_FILE);

    if (overShared && !tree.exists(configFile)) {
      context.logger.info(
        `${configFile} goes over ${SHARED_CONFIG_FILE} and holds what differs from it.`,
      );
    }

    return mergeWith(
      apply(url('./ng-add/files/schematics-config'), [
        applyTemplates({
          schematicConfigFileName: posix.basename(configFile, '.json'),
          schematicConfig: JSON.stringify(
            overShared
              ? settingsOverShared(tree, ruleContext, schematicConfig)
              : schematicConfig,
            null,
            2,
          ),
        }),
        move(posix.dirname(configFile)),
        skipExistingFiles(tree, context, 'schematics configuration file'),
      ]),
    );
  };
}
