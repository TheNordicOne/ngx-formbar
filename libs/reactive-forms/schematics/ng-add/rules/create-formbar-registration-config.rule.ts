import { RuleContext } from '../schema';
import { skipExistingFiles } from './skip-existing-files.rule';
import {
  apply,
  applyTemplates,
  mergeWith,
  move,
  Rule,
  url,
} from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';

export function createFormbarRegistrationsConfig(
  ruleContext: RuleContext,
): Rule {
  return (tree, context) => {
    const {
      includeAsyncValidators,
      includeSyncValidators,
      providerConfigDirectory,
      providerConfigFileName,
      useTokens,
      splitRegistrations,
      registrationsDirectory,
      provideInline,
    } = ruleContext;

    if (provideInline) {
      return;
    }

    const template = useTokens
      ? 'token'
      : splitRegistrations
        ? 'config'
        : 'inline';

    const registrationsRelativePath = buildRelativePath(
      `${providerConfigDirectory}/${providerConfigFileName}.ts`,
      registrationsDirectory,
    );

    return mergeWith(
      apply(url(`./ng-add/files/provider-config/${template}`), [
        applyTemplates({
          includeSyncValidators,
          includeAsyncValidators,
          registrationsPath: registrationsRelativePath,
          providerConfigFileName,
        }),
        move(providerConfigDirectory),
        skipExistingFiles(tree, context, 'provider file'),
      ]),
    );
  };
}
