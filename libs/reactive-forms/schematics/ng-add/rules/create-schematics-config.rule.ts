import {
  apply,
  applyTemplates,
  mergeWith,
  move,
  Rule,
  url,
} from '@angular-devkit/schematics';
import { normalize } from '@angular-devkit/core';
import { RuleContext } from '../schema';
import {
  DEFAULT_REGISTRATION_TYPE,
  DEFAULT_REGISTRATIONS_PATH,
  NgxFormbarAutomationConfig,
} from '@ngx-formbar/setup';
import {
  DEFAULT_CONTENT_TYPE_EXPORT_NAME,
  DEFAULT_CONTENT_TYPE_FILE_NAME,
  DEFAULT_CONTENT_TYPE_PATH,
} from '../../shared/constants';

export function createSchematicsConfig(ruleContext: RuleContext): Rule {
  return (_, context) => {
    const {
      useSchematicConfig,
      schematicsConfigPath,
      schematicConfigFileName,
      projectRoot,
      helperPath,
      useHelper,
      registrationsPath,
      registrationStyle,
    } = ruleContext;

    if (!useSchematicConfig || !schematicsConfigPath) {
      return;
    }

    context.logger.info('Creating schematics config file');

    const schematicConfig: NgxFormbarAutomationConfig = {};

    if (registrationStyle !== DEFAULT_REGISTRATION_TYPE) {
      schematicConfig.registrationType = registrationStyle;
    }

    if (registrationsPath !== DEFAULT_REGISTRATIONS_PATH) {
      schematicConfig.controlRegistrationsPath = registrationsPath;
    }

    if (useHelper) {
      schematicConfig.viewProviderHelperPath = helperPath;
    }

    schematicConfig.schema = {
      type: `${DEFAULT_CONTENT_TYPE_PATH}/${DEFAULT_CONTENT_TYPE_FILE_NAME}.ts#${DEFAULT_CONTENT_TYPE_EXPORT_NAME}`,
      docs: true,
      emitters: [{ use: 'json-schema-2020-12', output: 'form.schema.json' }],
    };

    return mergeWith(
      apply(url('./ng-add/files/schematics-config'), [
        applyTemplates({
          schematicConfigFileName,
          schematicConfig: JSON.stringify(schematicConfig, null, 2),
        }),
        move(normalize(`${projectRoot}/${schematicsConfigPath}`)),
      ]),
    );
  };
}
