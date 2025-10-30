import { RuleContext } from '../schema';
import { Rule, SchematicsException } from '@angular-devkit/schematics';

import {
  applyToUpdateRecorder,
  Change,
} from '@schematics/angular/utility/change';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import {
  findVariableWithObjectLiteral,
  isObjectLiteralWithProperty,
} from '../../../shared/ast';

import {
  createSourceFile,
  isArrayLiteralExpression,
  isIdentifier,
  isPropertyAssignment,
  PropertyAssignment,
  ScriptTarget,
} from 'typescript';
import { buildProvidersUpdate, replaceNodeWithPrinted } from '../helper';

export function updateAppConfig(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const { appConfigPath } = ruleContext;

    context.logger.info('Updating app.config.ts');

    const buffer = tree.read(appConfigPath);
    if (!buffer) {
      throw new SchematicsException(
        `Missing file or unreadable: ${appConfigPath}`,
      );
    }

    const content = buffer.toString('utf-8');
    const sourceFile = createSourceFile(
      appConfigPath,
      content,
      ScriptTarget.Latest,
      true,
    );

    const changes: Change[] = [
      insertImport(
        sourceFile,
        appConfigPath,
        'provideFormbar',
        'ngx-formbar',
        false,
      ),
    ];

    const appConfig = findVariableWithObjectLiteral(sourceFile, (variable) =>
      isObjectLiteralWithProperty(variable, 'providers'),
    );

    const providersProp = appConfig?.properties.find(
      (prop) =>
        isPropertyAssignment(prop) &&
        isIdentifier(prop.name) &&
        prop.name.text === 'providers',
    ) as PropertyAssignment | undefined;

    const providersInit = providersProp?.initializer;
    if (!providersInit) {
      throw new SchematicsException(`'providers' array not found in appConfig`);
    }
    if (!isArrayLiteralExpression(providersInit)) {
      throw new SchematicsException(`'providers' is not an array`);
    }

    context.logger.info(
      `providerConfigPath=${ruleContext.providerConfigPath ?? ''}`,
    );

    const { updatedProvidersArray, extraChanges, didChange } =
      buildProvidersUpdate(sourceFile, ruleContext, providersInit);

    changes.push(...extraChanges);

    if (didChange) {
      changes.push(
        ...replaceNodeWithPrinted(
          sourceFile,
          appConfigPath,
          content,
          providersInit,
          updatedProvidersArray,
        ),
      );
    }

    const recorder = tree.beginUpdate(appConfigPath);
    applyToUpdateRecorder(recorder, changes);
    tree.commitUpdate(recorder);

    context.logger.info('app.config.ts updated');
    return tree;
  };
}
