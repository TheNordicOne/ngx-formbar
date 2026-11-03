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
  addComponentRegistration,
  componentRegistrationsObjectHasKey,
  componentRegistrationsObjectUsesComponent,
  findComponentRegistrationsObject,
} from '@ngx-formbar/setup';

export function registerTypeConfig(
  ruleContext: RegisterComponentContext,
): Rule {
  return (tree, context) => {
    const {
      controlRegistrationsPath,
      key,
      componentFilePath,
      componentClassName,
      tsConfigPath,
      addedWarning,
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

    const registrationsObject = findComponentRegistrationsObject(
      registrationsSourceFile,
    );

    if (!registrationsObject) {
      context.logger.warn(
        registrationsMissingMessage(controlRegistrationsPath),
      );
      return tree;
    }

    const componentAlreadyUsed = componentRegistrationsObjectUsesComponent(
      registrationsObject,
      {
        tree,
        tsConfigPath,
        className: componentClassName,
        filePath: componentFilePath,
      },
    );

    if (componentAlreadyUsed) {
      context.logger.log(
        alreadyRegisteredLevel,
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

    const changes: Change[] = [];

    const loadComponentImport = insertImport(
      registrationsSourceFile,
      controlRegistrationsPath,
      'loadComponent',
      '@ngx-formbar/core',
    );
    changes.push(loadComponentImport);

    const updateChanges = addComponentRegistration(
      tree,
      registrationsSourceFile,
      controlRegistrationsPath,
      registrationsObject,
      key,
      componentClassName,
      componentImportPath,
    );

    changes.push(...updateChanges);

    const recorder = tree.beginUpdate(controlRegistrationsPath);
    applyToUpdateRecorder(recorder, changes);
    tree.commitUpdate(recorder);

    if (addedWarning) {
      context.logger.warn(addedWarning);
    }

    return tree;
  };
}
