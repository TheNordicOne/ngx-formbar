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
import { NgxFormworkAutomationConfig } from '../../../shared/shared-config.type';
import {
  DEFAULT_HELPER_PATH,
  DEFAULT_PROVIDER_CONFIG_FILE_NAME,
  DEFAULT_PROVIDER_CONFIG_PATH,
  DEFAULT_REGISTRATION_TYPE,
  DEFAULT_REGISTRATIONS_PATH,
} from '../../../shared/constants';

export function createSchematicsConfig(ruleContext: RuleContext): Rule {
  return (_, context) => {
    const {
      useSchematicConfig,
      schematicsConfigPath,
      schematicConfigFileName,
      projectRoot,
      providerConfigPath,
      providerConfigFileName,
      helperPath,
      registrationsPath,
      registrationStyle,
    } = ruleContext;

    if (!useSchematicConfig || !schematicsConfigPath) {
      return;
    }

    context.logger.info('Creating schematics config file');

    const schematicConfig: NgxFormworkAutomationConfig = {};

    if (registrationStyle !== DEFAULT_REGISTRATION_TYPE) {
      schematicConfig.registrationType = registrationStyle;
    }

    if (registrationsPath !== DEFAULT_REGISTRATIONS_PATH) {
      schematicConfig.controlRegistrationsPath = registrationsPath;
    }

    if (providerConfigPath !== DEFAULT_PROVIDER_CONFIG_PATH) {
      schematicConfig.providerConfigPath = providerConfigPath;
    }

    if (providerConfigFileName !== DEFAULT_PROVIDER_CONFIG_FILE_NAME) {
      schematicConfig.providerConfigFileName = `${providerConfigFileName ?? ''}.ts`;
    }

    if (helperPath !== DEFAULT_HELPER_PATH) {
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
