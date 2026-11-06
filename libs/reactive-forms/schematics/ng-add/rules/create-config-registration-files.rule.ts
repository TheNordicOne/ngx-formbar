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
import { normalize } from '@angular-devkit/core';
import { includeTemplates } from './include-templates.rule';

export function createConfigRegistrationFiles(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const {
      includeAsyncValidators,
      includeSyncValidators,
      useTokens,
      splitRegistrations,
      registrationsDirectory,
    } = ruleContext;

    if (useTokens || !splitRegistrations) {
      return;
    }

    const templatesToInclude = [
      normalize('/index.ts.template'),
      normalize('/component-registrations.ts.template'),
    ];

    if (includeSyncValidators) {
      templatesToInclude.push(
        normalize('/validator-registrations.ts.template'),
      );
    }

    if (includeAsyncValidators) {
      templatesToInclude.push(
        normalize('/async-validator-registrations.ts.template'),
      );
    }

    return mergeWith(
      apply(url('./ng-add/files/config-registrations'), [
        includeTemplates(templatesToInclude),
        applyTemplates({
          includeSyncValidators,
          includeAsyncValidators,
        }),
        move(registrationsDirectory),
        skipExistingFiles(tree, context, 'registration configuration files'),
      ]),
    );
  };
}
