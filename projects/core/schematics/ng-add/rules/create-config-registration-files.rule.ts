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

export function createConfigRegistrationFiles(ruleContext: RuleContext): Rule {
  return () => {
    const {
      includeAsyncValidators,
      includeSyncValidators,
      useTokens,
      splitRegistrations,
      registrationsPath,
    } = ruleContext;

    if (useTokens || !splitRegistrations || !registrationsPath) {
      return;
    }

    const templatesToInclude = [
      normalize('config-registrations/component-registrations.ts.template'),
    ];

    if (includeSyncValidators) {
      templatesToInclude.push(
        normalize('config-registrations/validator-registrations.ts.template'),
      );
    }

    if (includeAsyncValidators) {
      templatesToInclude.push(
        normalize(
          'config-registrations/async-validator-registrations.ts.template',
        ),
      );
    }

    return mergeWith(
      apply(url('./files/config-registrations'), [
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
