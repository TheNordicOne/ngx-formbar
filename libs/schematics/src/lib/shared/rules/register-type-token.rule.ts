import { RegisterComponentContext } from '../schema';
import { Rule } from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';

import {
  applyToUpdateRecorder,
  Change,
} from '@schematics/angular/utility/change';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import {
  loadSourceFile,
  registrationsMissingMessage,
  registrationsNotFoundMessage,
  findComponentRegistrationsNode,
  findMapArrayLiteral,
  registrationNodeHasKey,
  registrationNodeUsesIdentifier,
  updateMapEntries,
} from '@ngx-formbar/setup';

export function registerTypeToken(ruleContext: RegisterComponentContext): Rule {
  return (tree, context) => {
    const {
      controlRegistrationsPath,
      key,
      componentFilePath,
      componentClassName,
      alreadyRegisteredLevel,
    } = ruleContext;

    if (!controlRegistrationsPath) {
      return tree;
    }

    const registrationsSourceFile = loadSourceFile(
      tree,
      controlRegistrationsPath,
    );

    if (!registrationsSourceFile) {
      context.logger.warn(
        registrationsNotFoundMessage(controlRegistrationsPath),
      );
      return tree;
    }

    const mapNode = findComponentRegistrationsNode(registrationsSourceFile);

    const mapArrayLiteral = mapNode && findMapArrayLiteral(mapNode);

    if (!mapNode || !mapArrayLiteral) {
      context.logger.warn(
        registrationsMissingMessage(controlRegistrationsPath),
      );
      return tree;
    }

    const identifierAlreadyUsed = registrationNodeUsesIdentifier(
      mapNode,
      componentClassName,
    );

    if (identifierAlreadyUsed) {
      context.logger.log(
        alreadyRegisteredLevel,
        `A component with the name "${componentClassName}" is already used`,
      );
      return tree;
    }

    const keyAlreadyUsed = registrationNodeHasKey(mapNode, key);
    if (keyAlreadyUsed) {
      context.logger.warn(`A key with the name "${key}" is already used`);
      return tree;
    }

    const componentImportPath = buildRelativePath(
      controlRegistrationsPath,
      componentFilePath,
    ).replace(/\.ts$/, '');

    const changes: Change[] = [];

    const loadComponentImport = insertImport(
      registrationsSourceFile,
      controlRegistrationsPath,
      'loadComponent',
      '@ngx-formbar/core',
    );
    changes.push(loadComponentImport);

    const updateChanges = updateMapEntries(
      tree,
      registrationsSourceFile,
      controlRegistrationsPath,
      mapArrayLiteral,
      key,
      componentClassName,
      componentImportPath,
    );

    changes.push(...updateChanges);

    const recorder = tree.beginUpdate(controlRegistrationsPath);
    applyToUpdateRecorder(recorder, changes);
    tree.commitUpdate(recorder);
    return tree;
  };
}
