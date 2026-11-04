import { RuleContext } from '../schema';
import { Rule, SchematicsException } from '@angular-devkit/schematics';

import { applyToUpdateRecorder } from '@schematics/angular/utility/change';
import {
  appendToLiteral,
  findProvidersProperty,
  loadSourceFile,
} from '@ngx-formbar/setup';

import {
  createSourceFile,
  isArrayLiteralExpression,
  isPropertyAssignment,
  ScriptTarget,
} from 'typescript';
import { buildProvidersUpdate } from '../helper';
import { addMissingProviders, findProvidersOwner } from '../root-providers';

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

    const { addedElements, importChanges } = buildProvidersUpdate(
      tree,
      sourceFile,
      ruleContext,
      providersInit,
    );
    const changes = [
      ...importChanges,
      ...(addedElements.length > 0
        ? appendToLiteral(
            sourceFile,
            appConfigPath,
            providersInit,
            addedElements,
          )
        : []),
    ];

    const recorder = tree.beginUpdate(appConfigPath);
    applyToUpdateRecorder(recorder, changes);
    tree.commitUpdate(recorder);

    context.logger.info(`${appConfigPath} updated`);
    return tree;
  };
}
