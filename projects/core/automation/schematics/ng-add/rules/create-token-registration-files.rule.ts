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
  return (_, context) => {
    const {
      includeAsyncValidators,
      includeSyncValidators,
      useTokens,
      registrationsPath,
      splitRegistrations,
      projectRoot,
    } = ruleContext;

    if (!useTokens || !splitRegistrations || !registrationsPath) {
      return;
    }

    context.logger.info('Creating token registration files');

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
      apply(url('./files/token-registrations'), [
        includeTemplates(templatesToInclude),
        applyTemplates({
          includeSyncValidators,
          includeAsyncValidators,
          ...strings,
        }),
        move(normalize(`${projectRoot}/${registrationsPath}`)),
      ]),
    );
  };
}
