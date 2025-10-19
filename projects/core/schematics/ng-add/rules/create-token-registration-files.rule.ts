import {
  apply,
  applyTemplates,
  mergeWith,
  move,
  Rule,
  url,
} from '@angular-devkit/schematics';
import { RuleContext } from '../schema';
import { normalize, strings } from '@angular-devkit/core';
import { includeTemplates } from './include-templates.rule';

export function createTokenRegistrationFiles(ruleContext: RuleContext): Rule {
  return () => {
    const {
      includeAsyncValidators,
      includeSyncValidators,
      useTokens,
      registrationsPath,
      splitRegistrations,
    } = ruleContext;

    if (!useTokens || !splitRegistrations || !registrationsPath) {
      return;
    }

    const templatesToInclude = [
      normalize('token-registrations/component-registrations.ts.template'),
    ];

    if (includeSyncValidators) {
      templatesToInclude.push(
        normalize('token-registrations/validator-registrations.ts.template'),
      );
    }

    if (includeAsyncValidators) {
      templatesToInclude.push(
        normalize(
          'token-registrations/async-validator-registrations.ts.template',
        ),
      );
    }

    return mergeWith(
      apply(url('./files/token-registrations'), [
        includeTemplates(templatesToInclude),
        applyTemplates({
          includeSyncValidators,
          includeAsyncValidators,
          ...strings,
        }),
        move(normalize(registrationsPath)),
      ]),
    );
  };
}
