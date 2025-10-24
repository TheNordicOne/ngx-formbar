import { RegisterComponentContext } from '../schema';
import { Rule } from '@angular-devkit/schematics';
import {
  addComponentRegistration,
  componentRegistrationsObjectHasKey,
  componentRegistrationsObjectUsesIdentifier,
  findComponentRegistrationsObject,
  loadSourceFile,
} from '../ast';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import {
  applyToUpdateRecorder,
  Change,
} from '@schematics/angular/utility/change';
import { insertImport } from '@schematics/angular/utility/ast-utils';

export function registerTypeMap(ruleContext: RegisterComponentContext): Rule {
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

    const registrationsObject = findComponentRegistrationsObject(
      registrationsSourceFile,
    );

    if (!registrationsObject) {
      return tree;
    }

    const identifierAlreadyUsed = componentRegistrationsObjectUsesIdentifier(
      registrationsObject,
      componentClassName,
    );

    if (identifierAlreadyUsed) {
      context.logger.warn(
        `A component with the name "${componentClassName}" is already used`,
      );
      return tree;
    }

    const keyAlreadyUsed = componentRegistrationsObjectHasKey(
      registrationsObject,
      key,
    );
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

    const updateChanges = addComponentRegistration(
      tree,
      registrationsSourceFile,
      controlRegistrationsPath,
      registrationsObject,
      key,
      componentClassName,
    );

    changes.push(...updateChanges);

    const recorder = tree.beginUpdate(controlRegistrationsPath);
    applyToUpdateRecorder(recorder, changes);
    tree.commitUpdate(recorder);

    return tree;
  };
}
