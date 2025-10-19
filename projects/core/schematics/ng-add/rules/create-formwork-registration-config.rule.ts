import { RuleContext } from '../schema';
import {
  apply,
  applyTemplates,
  mergeWith,
  move,
  Rule,
  url,
} from '@angular-devkit/schematics';
import { normalize, strings } from '@angular-devkit/core';

export function createFormworkRegistrationsConfig(
  ruleContext: RuleContext,
): Rule {
  return () => {
    const {
      useRegistrationConfig,
      includeAsyncValidators,
      includeSyncValidators,
      providerConfigPath,
      providerConfigFileName,
      useTokens,
      splitRegistrations,
      registrationsPath,
    } = ruleContext;

    if (
      !useRegistrationConfig ||
      !providerConfigPath ||
      !providerConfigFileName
    ) {
      return;
    }

    return mergeWith(
      apply(url('./files/provider-config'), [
        applyTemplates({
          includeSyncValidators,
          includeAsyncValidators,
          useTokens,
          useConfig: useRegistrationConfig,
          splitRegistrations,
          registrationsPath,
          ...strings,
        }),
        move(normalize(`${providerConfigPath}/${providerConfigFileName}`)),
      ]),
    );
  };
}
