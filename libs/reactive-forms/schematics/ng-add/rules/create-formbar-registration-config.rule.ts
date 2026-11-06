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
import { registrationImportStatements } from '../helper';

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

    const registrationImports = registrationImportStatements(
      tree,
      `${providerConfigDirectory}/${providerConfigFileName}.ts`,
      registrationsDirectory,
      [
        'componentRegistrations',
        ...(includeSyncValidators ? ['validatorRegistrations'] : []),
        ...(includeAsyncValidators ? ['asyncValidatorRegistrations'] : []),
      ],
    );

    return mergeWith(
      apply(url(`./ng-add/files/provider-config/${template}`), [
        applyTemplates({
          includeSyncValidators,
          includeAsyncValidators,
          registrationImports,
          providerConfigFileName,
        }),
        move(providerConfigDirectory),
        skipExistingFiles(tree, context, 'provider file'),
      ]),
    );
  };
}
