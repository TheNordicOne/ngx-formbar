import { RuleContext } from '../schema';
import { Rule, SchematicsException } from '@angular-devkit/schematics';

import { applyToUpdateRecorder } from '@schematics/angular/utility/change';
import { appendToLiteral, findProvidersProperty } from '@ngx-formbar/setup';

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

    const parse = () =>
      createSourceFile(
        appConfigPath,
        tree.readText(appConfigPath),
        ScriptTarget.Latest,
        true,
      );

    addMissingProviders(tree, parse(), rootConfig);

    const sourceFile = parse();
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
