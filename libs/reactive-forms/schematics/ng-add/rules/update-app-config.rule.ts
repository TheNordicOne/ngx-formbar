import { RuleContext } from '../schema';
import { Rule, SchematicsException } from '@angular-devkit/schematics';

import {
  applyToUpdateRecorder,
  Change,
} from '@schematics/angular/utility/change';
import { findProvidersProperty, loadSourceFile } from '@ngx-formbar/setup';

import {
  createSourceFile,
  isArrayLiteralExpression,
  isPropertyAssignment,
  ScriptTarget,
} from 'typescript';
import { buildProvidersUpdate, replaceNodeWithPrinted } from '../helper';
import {
  addMissingProviders,
  findProvidersOwner,
  insertNamedImport,
} from '../root-config';
import { REACTIVE_FORMS_PACKAGE_NAME } from '../../shared/constants';

export function updateAppConfig(ruleContext: RuleContext): Rule {
  return (tree, context) => {
    const { appConfigPath, rootConfig } = ruleContext;

    context.logger.info(`Updating ${appConfigPath}`);

    const original = loadSourceFile(tree, appConfigPath);
    if (!original) {
      throw new SchematicsException(
        `Missing file or unreadable: ${appConfigPath}`,
      );
    }

    addMissingProviders(tree, original, rootConfig);

    const content = tree.readText(appConfigPath);
    const sourceFile = createSourceFile(
      appConfigPath,
      content,
      ScriptTarget.Latest,
      true,
    );

    const changes: Change[] = [
      insertNamedImport(
        sourceFile,
        appConfigPath,
        'provideFormbar',
        REACTIVE_FORMS_PACKAGE_NAME,
      ),
    ];

    const owner = findProvidersOwner(sourceFile, rootConfig);
    const providers = owner && findProvidersProperty(owner);
    const providersInit =
      providers && isPropertyAssignment(providers)
        ? providers.initializer
        : null;

    if (!providersInit || !isArrayLiteralExpression(providersInit)) {
      throw new SchematicsException(
        `'providers' array not found in ${appConfigPath}`,
      );
    }

    const { updatedProvidersArray, extraChanges, didChange } =
      buildProvidersUpdate(tree, sourceFile, ruleContext, providersInit);

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

    context.logger.info(`${appConfigPath} updated`);
    return tree;
  };
}
