import { RuleContext } from '../schema';
import { Rule, SchematicsException } from '@angular-devkit/schematics';
import { ts } from 'ts-morph';
import {
  Change,
  InsertChange,
  ReplaceChange,
} from '@schematics/angular/utility/change';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import { CallExpression, createSourceFile } from 'typescript';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import {
  addArguments,
  addUniqueArrayElement,
  appendArrayElement,
  findVariableWithObjectLiteral,
  isObjectLiteralWithProperty,
} from '../../../automation/ast';

export function updateAppConfig(ruleContext: RuleContext): Rule {
  return (tree) => {
    const { projectRoot, registrationStyle, registrationsPath } = ruleContext;

    const path = `${projectRoot}/src/app/app.config.ts`;
    const buffer = tree.read(path);

    if (!buffer) {
      throw new SchematicsException(`Missing file or unreadable: ${path}`);
    }

    const content = buffer.toString('utf-8');
    const sourceFile = createSourceFile(
      path,
      content,
      ts.ScriptTarget.Latest,
      true,
    );

    const changes: Change[] = [
      insertImport(sourceFile, path, 'provideFormwork', 'ngx-formwork', false),
    ];

    const appConfig = findVariableWithObjectLiteral(sourceFile, (variable) =>
      isObjectLiteralWithProperty(variable, 'providers'),
    );

    const providersProp = appConfig?.properties.find(
      (prop) =>
        ts.isPropertyAssignment(prop) &&
        ts.isIdentifier(prop.name) &&
        prop.name.text === 'providers',
    ) as ts.PropertyAssignment | undefined;

    const providersInit = providersProp?.initializer;

    if (!providersInit) {
      throw new SchematicsException(`'providers' array not found in appConfig`);
    }

    if (!ts.isArrayLiteralExpression(providersInit)) {
      throw new SchematicsException(`'providers' is not an array`);
    }

    const providersArray = structuredClone(providersInit);

    const isProvideFormworkCall = (el: ts.Expression) =>
      ts.isCallExpression(el) &&
      ts.isIdentifier(el.expression) &&
      el.expression.text === 'provideFormwork';

    let provideFormworkExpression = providersArray.elements.find(
      isProvideFormworkCall,
    ) as CallExpression | undefined;

    provideFormworkExpression ??= ts.factory.createCallExpression(
      ts.factory.createIdentifier('provideFormwork'),
      undefined,
      [],
    );

    const componentRegistrationsImportPath = buildRelativePath(
      path,
      registrationsPath ?? '',
    );

    switch (registrationStyle) {
      case 'inline':
        provideFormworkExpression = addArguments(provideFormworkExpression, [
          ts.factory.createObjectLiteralExpression([
            ts.factory.createPropertyAssignment(
              'componentRegistrations',
              ts.factory.createObjectLiteralExpression([]),
            ),
          ]),
        ]);
        addUniqueArrayElement(
          providersArray,
          provideFormworkExpression,
          isProvideFormworkCall,
        );
        break;
      case 'file':
        changes.push(
          insertImport(
            sourceFile,
            path,
            'componentRegistrations',
            componentRegistrationsImportPath,
            false,
          ),
        );
        provideFormworkExpression = addArguments(provideFormworkExpression, [
          ts.factory.createObjectLiteralExpression([
            ts.factory.createShorthandPropertyAssignment(
              'componentRegistrations',
            ),
          ]),
        ]);
        addUniqueArrayElement(
          providersArray,
          provideFormworkExpression,
          isProvideFormworkCall,
        );
        break;

      default:
        changes.push(
          insertImport(
            sourceFile,
            path,
            'componentRegistrationsProvider',
            componentRegistrationsImportPath,
            false,
          ),
        );

        addUniqueArrayElement(
          providersArray,
          provideFormworkExpression,
          isProvideFormworkCall,
        );
        appendArrayElement(
          providersArray,
          ts.factory.createIdentifier('componentRegistrationsProvider'),
        );
    }

    const providersChange = replaceNodeWithPrinted(
      sourceFile,
      path,
      content,
      providersInit,
      providersArray,
    );
    changes.push(...providersChange);

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

function replaceNodeWithPrinted(
  sf: ts.SourceFile,
  filePath: string,
  fileText: string,
  original: ts.Node,
  replacement: ts.Node,
): Change[] {
  const printer = ts.createPrinter({});
  const printed = printer.printNode(ts.EmitHint.Unspecified, replacement, sf);
  const start = original.getStart(sf);
  const end = original.getEnd();
  return [
    new ReplaceChange(filePath, start, fileText.slice(start, end), printed),
  ];
}
