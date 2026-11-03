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
  DEFAULT_CONTENT_TYPE_EXPORT_NAME,
  DEFAULT_CONTENT_TYPE_FILE_NAME,
  DEFAULT_CONTENT_TYPE_PATH,
} from '../../shared/constants';

export function createSchematicsConfig(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const {
      useSchematicConfig,
      schematicsConfigDirectory,
      schematicConfigFileName,
      projectRoot,
    } = ruleContext;

    if (!useSchematicConfig) {
      return;
    }

    const schematicConfig: NgxFormbarAutomationConfig = {
      ...generatorDefaults(ruleContext),
      schema: {
        type: `${sourceRootValue(joinToSourceRoot(`${DEFAULT_CONTENT_TYPE_PATH}/${DEFAULT_CONTENT_TYPE_FILE_NAME}.ts`, projectRoot), projectRoot)}#${DEFAULT_CONTENT_TYPE_EXPORT_NAME}`,
        emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
      },
    };

    return mergeWith(
      apply(url('./ng-add/files/schematics-config'), [
        applyTemplates({
          schematicConfigFileName,
          schematicConfig: JSON.stringify(schematicConfig, null, 2),
        }),
        move(schematicsConfigDirectory),
        skipExistingFiles(tree, context, 'schematics configuration file'),
      ]),
    );
  };
}
