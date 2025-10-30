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
} from '../../../shared/constants';
import { NgxFormbarAutomationConfig } from '../../../shared/shared-config.type';

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
      schematicConfig.control = {
        hostDirectiveHelperPath: helperPath,
      };
      schematicConfig.group = {
        hostDirectiveHelperPath: helperPath,
      };
      schematicConfig.block = {
        hostDirectiveHelperPath: helperPath,
      };
    }

    return mergeWith(
      apply(url('./files/schematics-config'), [
        applyTemplates({
          schematicConfigFileName,
          schematicConfig: JSON.stringify(schematicConfig, null, 2),
        }),
        move(normalize(`${projectRoot}/${schematicsConfigPath}`)),
      ]),
    );
  };
}
