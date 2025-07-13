import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { Change, InsertChange } from '@schematics/angular/utility/change';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import * as ts from 'typescript';
import { normalize } from '@angular-devkit/core';

interface NgAddOptions {
  project?: string;
}

function createFormworkConfig(projectRoot: string): Rule {
  return mergeWith(
    apply(url('./files'), [
      applyTemplates({}),
      move(normalize(`${projectRoot}/src/app`)),
    ]),
  );
}

function updateAppConfig(projectRoot: string): Rule {
  return (tree: Tree) => {
    const path = `${projectRoot}/src/app/app.config.ts`;
    const buffer = tree.read(path);
    if (!buffer)
      throw new SchematicsException(`Missing file or unreadable: ${path}`);

    const content = buffer.toString('utf-8');
    const sourceFile = ts.createSourceFile(
      path,
      content,
      ts.ScriptTarget.Latest,
      true,
    );
    const changes: Change[] = [];

    // Add imports
    changes.push(
      insertImport(sourceFile, path, 'provideFormwork', 'ngx-formwork', false),
    );
    changes.push(
      insertImport(
        sourceFile,
        path,
        'formworkConfig',
        './formwork.config',
        false,
      ),
    );

    // Locate appConfig object
    const appConfigVar = sourceFile.statements.find(
      (stmt) =>
        ts.isVariableStatement(stmt) &&
        stmt.declarationList.declarations.some(
          (d) => d.name.getText() === 'appConfig',
        ),
    ) as ts.VariableStatement | undefined;

    if (!appConfigVar)
      throw new SchematicsException(`No 'appConfig' variable found in ${path}`);

    const initializer =
      appConfigVar.declarationList.declarations[0].initializer;
    if (!initializer || !ts.isObjectLiteralExpression(initializer)) {
      throw new SchematicsException(
        `'appConfig' must be initialized as an object.`,
      );
    }

    const providersProp = initializer.properties.find(
      (prop) =>
        ts.isPropertyAssignment(prop) &&
        ts.isIdentifier(prop.name) &&
        prop.name.text === 'providers',
    ) as ts.PropertyAssignment | undefined;

    if (
      !providersProp ||
      !ts.isArrayLiteralExpression(providersProp.initializer)
    ) {
      throw new SchematicsException(`'providers' array not found in appConfig`);
    }

    const alreadyIncluded = providersProp.initializer.elements.some(
      (el) =>
        ts.isCallExpression(el) &&
        ts.isIdentifier(el.expression) &&
        el.expression.text === 'provideFormwork',
    );

    if (!alreadyIncluded) {
      const insertPos = providersProp.initializer.elements.hasTrailingComma
        ? providersProp.initializer.end - 1
        : providersProp.initializer.elements.length > 0
          ? providersProp.initializer.elements[
              providersProp.initializer.elements.length - 1
            ].end
          : providersProp.initializer.end - 1;

      const hasElements = providersProp.initializer.elements.length > 0;
      const hasTrailingComma =
        providersProp.initializer.elements.hasTrailingComma;

      const insertText = hasElements
        ? hasTrailingComma
          ? ' provideFormwork(formworkConfig)'
          : ', provideFormwork(formworkConfig)'
        : 'provideFormwork(formworkConfig)';

      changes.push(new InsertChange(path, insertPos, insertText));
    }

    const recorder = tree.beginUpdate(path);
    for (const change of changes) {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    }
    tree.commitUpdate(recorder);
    return tree;
  };
}

interface PackageJson {
  dependencies: Record<string, string>;
}

function addDependencies(): Rule {
  return (tree: Tree) => {
    const pkgPath = 'package.json';
    if (!tree.exists(pkgPath)) {
      throw new SchematicsException(`Could not find ${pkgPath}`);
    }

    const pkgBuffer = tree.read(pkgPath);
    if (!pkgBuffer) {
      throw new SchematicsException(`Could not read ${pkgPath}`);
    }

    const pkgJson = JSON.parse(pkgBuffer.toString('utf-8')) as PackageJson;

    if (!pkgJson.dependencies['ngx-formwork']) {
      pkgJson.dependencies['ngx-formwork'] = '^0.6.0';
    }

    tree.overwrite(pkgPath, JSON.stringify(pkgJson, null, 2));
    return tree;
  };
}

export function ngAdd(options: NgAddOptions = {}): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(tree);
    const projectName =
      options.project ?? (workspace.extensions['defaultProject'] as string);

    if (!projectName) {
      throw new SchematicsException(
        'No project specified and no default project found.',
      );
    }

    const project = workspace.projects.get(projectName);
    if (!project) {
      throw new SchematicsException(
        `Project "${projectName}" not found in workspace.`,
      );
    }

    const projectRoot = project.root;

    context.logger.info(
      `📦 Setting up ngx-formwork in project "${projectName}"...`,
    );

    return chain([
      addDependencies(),
      createFormworkConfig(projectRoot),
      updateAppConfig(projectRoot),
      () => {
        context.addTask(new NodePackageInstallTask());
        context.logger.info('✅ ngx-formwork has been set up successfully!');
        return tree;
      },
    ]);
  };
}
