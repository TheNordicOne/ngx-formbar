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
import {
  joinToSourceRoot,
  NgxFormbarAutomationConfig,
  sourceRootValue,
} from '@ngx-formbar/setup';
import { generatorDefaults } from '../helper';
import {
  ignoredSettings,
  requestedSchematicsConfigFile,
  schematicsConfigFile,
  settingsStoppingToApply,
} from '../schematics-config-file';
import { posix } from 'node:path';
import {
  DEFAULT_CONTENT_TYPE_EXPORT_NAME,
  DEFAULT_CONTENT_TYPE_FILE_NAME,
  DEFAULT_CONTENT_TYPE_PATH,
} from '../../shared/constants';

export function createSchematicsConfig(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const { useSchematicConfig, projectRoot } = ruleContext;

    if (!useSchematicConfig) {
      return;
    }

    const configFile = schematicsConfigFile(tree, ruleContext);
    const ignored = ignoredSettings(tree, configFile, ruleContext);
    const requested = requestedSchematicsConfigFile(ruleContext);

    if (ignored.length > 0) {
      context.logger.warn(
        `${configFile} stays as it is, so these settings of this run are ignored: ${ignored.join(', ')}. Change them in that file.`,
      );
    }

    const schematicConfig: NgxFormbarAutomationConfig = {
      ...generatorDefaults(ruleContext),
      schema: {
        type: `${sourceRootValue(joinToSourceRoot(`${DEFAULT_CONTENT_TYPE_PATH}/${DEFAULT_CONTENT_TYPE_FILE_NAME}.ts`, projectRoot), projectRoot)}#${DEFAULT_CONTENT_TYPE_EXPORT_NAME}`,
        emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
      },
    };

    if (configFile !== requested && !tree.exists(configFile)) {
      const stopping = settingsStoppingToApply(
        tree,
        requested,
        schematicConfig,
      );

      context.logger.warn(
        `${configFile} now applies to this project instead of ${requested}.${stopping.length > 0 ? ` These settings of ${requested} stop applying: ${stopping.join(', ')}.` : ''}`,
      );
    }

    return mergeWith(
      apply(url('./ng-add/files/schematics-config'), [
        applyTemplates({
          schematicConfigFileName: posix.basename(configFile, '.json'),
          schematicConfig: JSON.stringify(schematicConfig, null, 2),
        }),
        move(posix.dirname(configFile)),
        skipExistingFiles(tree, context, 'schematics configuration file'),
      ]),
    );
  };
}
