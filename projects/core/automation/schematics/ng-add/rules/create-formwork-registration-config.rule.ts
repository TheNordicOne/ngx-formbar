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
import { buildRelativePath } from '@schematics/angular/utility/find-module';

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
        ? 'config'
        : 'inline';

    const targetPath = normalize(`/${projectRoot}/${providerConfigPath}`);
    const registrations = `/${projectRoot}/${registrationsPath ?? ''}`;

    const registrationsRelativePath = buildRelativePath(
      `${targetPath}/${providerConfigFileName}.ts`,
      registrations,
    );

    return mergeWith(
      apply(url(`./files/provider-config/${template}`), [
        applyTemplates({
          includeSyncValidators,
          includeAsyncValidators,
          useTokens,
          useConfig: provideInline,
          splitRegistrations,
          registrationsPath: registrationsRelativePath,
          providerConfigFileName,
          ...strings,
        }),
        move(normalize(targetPath)),
      ]),
    );
  };
}
