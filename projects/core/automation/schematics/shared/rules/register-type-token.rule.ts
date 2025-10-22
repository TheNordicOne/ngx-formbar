import { ScaffoldContext } from '../schema';
import { Rule } from '@angular-devkit/schematics';
import {
  findComponentRegistrationsNode,
  findMapArrayLiteral,
  loadSourceFile,
  updateMapEntries,
} from '../ast';
import { buildRelativePath } from '@schematics/angular/utility/find-module';

import {
  applyToUpdateRecorder,
  Change,
} from '@schematics/angular/utility/change';
import { insertImport } from '@schematics/angular/utility/ast-utils';

export function registerTypeToken(ruleContext: ScaffoldContext): Rule {
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

    const mapNode = findComponentRegistrationsNode(registrationsSourceFile);

    if (!mapNode) {
      return tree;
    }

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
