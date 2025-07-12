import {
  apply,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics';
import * as ts from 'typescript';
import { insertImportAndObjectLiteral } from './utils';

function createFormworkConfig(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info('Creating Formwork Configuration File');
    const source = url('./files');
    const templates = apply(source, [template({}), move('src/app')]);
    return mergeWith(templates)(tree, {} as SchematicContext);
  };
}

function updateAppConfig(): Rule {
  return (tree: Tree) => {
    const appConfigPath = 'src/app/app.config.ts';
    const content = tree.read(appConfigPath);
    if (!content) {
      throw new Error('app.config.ts not found');
    }
    const sourceText = content.toString();
    const sourceFile = ts.createSourceFile(
      appConfigPath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
    );

    insertImportAndObjectLiteral(
      sourceFile,
      appConfigPath,
      tree,
      'provideFormwork',
      'ngx-formwork',
      'appConfig',
      'providers',
      'provideFormwork(formworkConfig)',
    );

    insertImportAndObjectLiteral(
      sourceFile,
      appConfigPath,
      tree,
      'formworkConfig',
      './formwork.config',
      'appConfig',
      'providers',
      '', // no need to add value again
    );

    return tree;
  };
}

export function ngAdd(): Rule {
  return chain([createFormworkConfig(), updateAppConfig()]);
}
