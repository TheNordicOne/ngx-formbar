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
  return (_, context) => {
    const {
      includeAsyncValidators,
      includeSyncValidators,
      providerConfigPath,
      providerConfigFileName,
      useTokens,
      splitRegistrations,
      registrationsPath,
      provideInline,
      projectRoot,
    } = ruleContext;

    if (provideInline || !providerConfigPath || !providerConfigFileName) {
      return;
    }

    context.logger.info('Creating provider file');

    const template = useTokens
      ? 'token'
      : splitRegistrations
        ? 'map'
        : 'inline';

    return mergeWith(
      apply(url(`./files/provider-config/${template}`), [
        applyTemplates({
          includeSyncValidators,
          includeAsyncValidators,
          useTokens,
          useConfig: provideInline,
          splitRegistrations,
          registrationsPath,
          providerConfigFileName,
          ...strings,
        }),
        move(normalize(`${projectRoot}/${providerConfigPath}`)),
      ]),
    );
  };
}
