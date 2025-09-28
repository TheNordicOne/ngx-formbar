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

import { normalize } from '@angular-devkit/core';
import { updateSchematicConfig } from '../shared/rules';
import { ts } from 'ts-morph';

interface NgAddOptions {
  project?: string;
  helper?: boolean;
  helperPath?: string;
  config?: boolean;
  includeSyncValidators?: boolean;
  includeAsyncValidators?: boolean;
}

function createFormworkConfig(
  projectRoot: string,
  options: NgAddOptions,
): Rule {
  return (tree: Tree) => {
    const targetPath = normalize(`${projectRoot}/src/app/formwork.config.ts`);

    const hasSync = options.includeSyncValidators !== false;
    const hasAsync = options.includeAsyncValidators !== false;

    const sections: string[] = ['  componentRegistrations: {\n  },'];

    if (hasSync) {
      sections.push('  validatorRegistrations: {\n  },');
    }
    if (hasAsync) {
      sections.push('  asyncValidatorRegistrations: {\n  },');
    }

    const content =
      "import { defineFormworkConfig } from 'ngx-formwork';\n\n" +
      'export const formworkConfig = defineFormworkConfig({\n' +
      sections.join('\n') +
      '\n});\n';

    if (tree.exists(targetPath)) {
      tree.overwrite(targetPath, content);
    } else {
      tree.create(targetPath, content);
    }

    return tree;
  };
}

function createProviderFiles(projectRoot: string, options: NgAddOptions): Rule {
  return (tree: Tree) => {
    const appDir = normalize(`${projectRoot}/src/app`);

    // Component registrations provider (always)
    const componentProviderPath = normalize(
      `${appDir}/component-registrations.provider.ts`,
    );
    const componentProviderContent =
      "import { NGX_FW_COMPONENT_REGISTRATIONS } from 'ngx-formwork';\n\n" +
      'export const componentRegistrationsProvider = {\n' +
      '  provide: NGX_FW_COMPONENT_REGISTRATIONS,\n' +
      '  useValue: new Map([\n' +
      '  ])\n' +
      '};\n';

    if (tree.exists(componentProviderPath)) {
      tree.overwrite(componentProviderPath, componentProviderContent);
    } else {
      tree.create(componentProviderPath, componentProviderContent);
    }

    const includeSync = options.includeSyncValidators !== false;
    const includeAsync = options.includeAsyncValidators !== false;

    if (includeSync || includeAsync) {
      const validatorProviderPath = normalize(
        `${appDir}/validator-registrations.provider.ts`,
      );

      const lines: string[] = [];
      if (includeSync && includeAsync) {
        lines.push(
          "import { NGX_FW_VALIDATOR_REGISTRATIONS, NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS } from 'ngx-formwork';\n",
        );
      } else if (includeSync) {
        lines.push(
          "import { NGX_FW_VALIDATOR_REGISTRATIONS } from 'ngx-formwork';\n",
        );
      } else if (includeAsync) {
        lines.push(
          "import { NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS } from 'ngx-formwork';\n",
        );
      }

      if (includeSync) {
        lines.push(
          'export const validatorRegistrationsProvider = {\n' +
            '  provide: NGX_FW_VALIDATOR_REGISTRATIONS,\n' +
            '  useValue: new Map([\n' +
            '  ])\n' +
            '};\n\n',
        );
      }

      if (includeAsync) {
        lines.push(
          'export const asyncValidatorRegistrationsProvider = {\n' +
            '  provide: NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,\n' +
            '  useValue: new Map([\n' +
            '  ])\n' +
            '};\n',
        );
      }

      const validatorProviderContent = lines.join('');

      if (tree.exists(validatorProviderPath)) {
        tree.overwrite(validatorProviderPath, validatorProviderContent);
      } else {
        tree.create(validatorProviderPath, validatorProviderContent);
      }
    }

    return tree;
  };
}

function updateAppConfig(projectRoot: string, options: NgAddOptions): Rule {
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

    // Always ensure provideFormwork import
    changes.push(
      insertImport(sourceFile, path, 'provideFormwork', 'ngx-formwork', false),
    );

    const useConfig = !!options.config;
    const includeSync = options.includeSyncValidators !== false;
    const includeAsync = options.includeAsyncValidators !== false;

    if (useConfig) {
      // import formworkConfig from './formwork.config'
      changes.push(
        insertImport(
          sourceFile,
          path,
          'formworkConfig',
          './formwork.config',
          false,
        ),
      );
    } else {
      // import providers from generated files
      changes.push(
        insertImport(
          sourceFile,
          path,
          'componentRegistrationsProvider',
          './component-registrations.provider',
          false,
        ),
      );
      if (includeSync || includeAsync) {
        const named: string[] = [];
        if (includeSync) named.push('validatorRegistrationsProvider');
        if (includeAsync) named.push('asyncValidatorRegistrationsProvider');
        if (named.length > 0) {
          changes.push(
            insertImport(
              sourceFile,
              path,
              named.join(', '),
              './validator-registrations.provider',
              false,
            ),
          );
        }
      }
    }

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

    const providersArray = providersProp.initializer;

    const hasProvideFormwork = providersArray.elements.some(
      (el) =>
        ts.isCallExpression(el) &&
        ts.isIdentifier(el.expression) &&
        el.expression.text === 'provideFormwork',
    );

    const toInsert: string[] = [];
    if (useConfig) {
      if (!hasProvideFormwork) {
        toInsert.push('provideFormwork(formworkConfig)');
      }
    } else {
      if (!hasProvideFormwork) {
        toInsert.push('provideFormwork()');
      }
      // Always add component registrations provider
      const hasComponentProvider = providersArray.elements.some(
        (el) =>
          ts.isIdentifier(el) &&
          el.getText() === 'componentRegistrationsProvider',
      );
      if (!hasComponentProvider) {
        toInsert.push('componentRegistrationsProvider');
      }
      if (includeSync) {
        const hasSyncProvider = providersArray.elements.some(
          (el) =>
            ts.isIdentifier(el) &&
            el.getText() === 'validatorRegistrationsProvider',
        );
        if (!hasSyncProvider) toInsert.push('validatorRegistrationsProvider');
      }
      if (includeAsync) {
        const hasAsyncProvider = providersArray.elements.some(
          (el) =>
            ts.isIdentifier(el) &&
            el.getText() === 'asyncValidatorRegistrationsProvider',
        );
        if (!hasAsyncProvider)
          toInsert.push('asyncValidatorRegistrationsProvider');
      }
    }

    if (toInsert.length > 0) {
      // Determine insertion position: after last element if any, else inside []
      const hasElements = providersArray.elements.length > 0;
      const hasTrailingComma = providersArray.elements.hasTrailingComma;

      let insertPos: number;
      let insertText: string;

      if (hasElements) {
        const lastEl =
          providersArray.elements[providersArray.elements.length - 1];
        insertPos = hasTrailingComma ? providersArray.end - 1 : lastEl.end;
        insertText = (hasTrailingComma ? ' ' : ', ') + toInsert.join(', ');
      } else {
        insertPos = providersArray.end - 1;
        insertText = toInsert.join(', ');
      }

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

      pkgJson.dependencies = Object.keys(pkgJson.dependencies)
        .sort()
        .reduce<Record<string, string>>((sorted, key) => {
          sorted[key] = pkgJson.dependencies[key];
          return sorted;
        }, {});
    }

    tree.overwrite(pkgPath, JSON.stringify(pkgJson, null, 2));
    return tree;
  };
}

/**
 * Optionally create helper files at specified helperPath
 */
function createHelperFiles(helperPath: string): Rule {
  return mergeWith(
    apply(url('./files/helper'), [
      applyTemplates({}),
      move(normalize(helperPath)),
    ]),
  );
}

/**
 * Update angular.json with helperPath for ngx-formwork schematics
 */
function updateSchematicsHelperPath(
  helperPath: string,
  projectName: string,
): Rule {
  return chain([
    updateSchematicConfig(
      'control',
      {
        helperPath,
      },
      projectName,
    ),
    updateSchematicConfig(
      'group',
      {
        helperPath,
      },
      projectName,
    ),
    updateSchematicConfig(
      'block',
      {
        helperPath,
      },
      projectName,
    ),
  ]);
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

    const rules: Rule[] = [];
    rules.push(addDependencies());

    // Default behavior: tokens via providers; optional config if --config
    if (options.config) {
      rules.push(createFormworkConfig(projectRoot, options));
    } else {
      rules.push(createProviderFiles(projectRoot, options));
    }

    if (options.helper) {
      const resolvedHelperPath =
        options.helperPath ?? `${projectRoot}/src/app/shared/helper`;
      rules.push(createHelperFiles(resolvedHelperPath));
      rules.push(updateSchematicsHelperPath(resolvedHelperPath, projectName));
    }

    rules.push(updateAppConfig(projectRoot, options));
    rules.push(() => {
      context.addTask(new NodePackageInstallTask());
      context.logger.info('✅ ngx-formwork has been set up successfully!');
      return tree;
    });
    return chain(rules);
  };
}
