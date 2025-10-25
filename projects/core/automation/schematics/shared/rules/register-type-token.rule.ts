import { RegisterComponentContext } from '../schema';
import { Rule } from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';

import {
  applyToUpdateRecorder,
  Change,
} from '@schematics/angular/utility/change';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import { loadSourceFile } from '../ast/parse';
import {
  findComponentRegistrationsNode,
  findMapArrayLiteral,
  registrationNodeHasKey,
  registrationNodeUsesIdentifier,
  updateMapEntries,
} from '../ast/registrations';

export function registerTypeToken(ruleContext: RegisterComponentContext): Rule {
  return (tree, context) => {
    const {
      controlRegistrationsPath,
      key,
      componentFilePath,
      componentClassName,
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
        `Registration file ${controlRegistrationsPath} could be found. Skipping registration.`,
      );
      return tree;
    }

    const mapNode = findComponentRegistrationsNode(registrationsSourceFile);

    if (!mapNode) {
      return tree;
    }

    const identifierAlreadyUsed = registrationNodeUsesIdentifier(
      mapNode,
      componentClassName,
    );

    if (identifierAlreadyUsed) {
      context.logger.warn(
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

    const changes: Change[] = [
      insertImport(
        registrationsSourceFile,
        controlRegistrationsPath,
        componentClassName,
        componentImportPath,
      ),
    ];

    const mapArrayLiteral = findMapArrayLiteral(mapNode);

    if (mapArrayLiteral) {
      const updateChanges = updateMapEntries(
        tree,
        registrationsSourceFile,
        controlRegistrationsPath,
        mapArrayLiteral,
        key,
        componentClassName,
      );

      changes.push(...updateChanges);
    }

    const recorder = tree.beginUpdate(controlRegistrationsPath);
    applyToUpdateRecorder(recorder, changes);
    tree.commitUpdate(recorder);
    return tree;
  };
}
