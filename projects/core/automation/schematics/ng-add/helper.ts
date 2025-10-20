import {
  ArrayLiteralExpression,
  createPrinter,
  EmitHint,
  Expression,
  factory,
  isCallExpression,
  isIdentifier,
  Node,
  SourceFile,
} from 'typescript';
import { Change, ReplaceChange } from '@schematics/angular/utility/change';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { normalize } from '@angular-devkit/core';
import { RegistrationType } from '../../shared/shared-config.type';

function isProvideFormworkCall(n: Expression): boolean {
  return (
    isCallExpression(n) &&
    isIdentifier(n.expression) &&
    n.expression.text === 'provideFormwork'
  );
}

function hasIdentifier(name: string): (n: Expression) => boolean {
  return function (n: Expression): boolean {
    return isIdentifier(n) && n.text === name;
  };
}

function compareElements(
  el: Expression,
  i: number,
  existingElements: Expression[],
): boolean {
  return el !== existingElements[i];
}

function createArgsForConfig(
  provideInline: boolean | undefined,
  registrationsPath: string | null | undefined,
  providerConfigImportPath: string | null | undefined,
  sourceFile: SourceFile,
  filePath: string,
  extraChanges: Change[],
): Expression[] {
  if (provideInline) {
    if (registrationsPath) {
      extraChanges.push(
        insertImport(
          sourceFile,
          filePath,
          'formworkConfig',
          registrationsPath,
          false,
        ),
      );
    }
    return [
      factory.createObjectLiteralExpression(
        [
          factory.createPropertyAssignment(
            'componentRegistrations',
            factory.createObjectLiteralExpression([], false),
          ),
        ],
        true,
      ),
    ];
  }
  if (providerConfigImportPath) {
    extraChanges.push(
      insertImport(
        sourceFile,
        filePath,
        'formworkConfig',
        providerConfigImportPath,
        false,
      ),
    );
  }
  return [factory.createIdentifier('formworkConfig')];
}

export function buildProvidersUpdate(args: {
  projectRoot: string;
  sourceFile: SourceFile;
  appConfigPath: string;
  fileText: string;
  providersArray: ArrayLiteralExpression;
  registrationStyle?: RegistrationType;
  registrationsPath?: string | null;
  providerConfigPath?: string | null;
  provideInline?: boolean;
}): {
  updatedProvidersArray: ArrayLiteralExpression;
  extraChanges: Change[];
  didChange: boolean;
} {
  const {
    sourceFile,
    appConfigPath,
    providersArray,
    registrationStyle,
    registrationsPath,
    provideInline,
    projectRoot,
    providerConfigPath,
  } = args;

  const extraChanges: Change[] = [];
  const existingElements = [...providersArray.elements];

  const hasProvideCall = existingElements.some(isProvideFormworkCall);

  const hasComponentRegistrationsProvider = existingElements.some(
    hasIdentifier('componentRegistrationsProvider'),
  );

  const newElements: Expression[] = [...existingElements];
  const registrationsImportPath = buildRelativePath(
    normalize(`/${appConfigPath}`),
    normalize(`/${projectRoot}/${registrationsPath ?? appConfigPath}`),
  );

  const providerConfigImportPath = buildRelativePath(
    normalize(`/${appConfigPath}`),
    normalize(`/${projectRoot}/${providerConfigPath ?? appConfigPath}`),
  );

  if (!hasProvideCall) {
    const callArgs = createArgsForConfig(
      provideInline,
      registrationsImportPath,
      providerConfigImportPath,
      sourceFile,
      appConfigPath,
      extraChanges,
    );

    const provideFormworkCall = factory.createCallExpression(
      factory.createIdentifier('provideFormwork'),
      undefined,
      callArgs,
    );

    newElements.push(provideFormworkCall);
  }

  if (registrationStyle === 'token') {
    if (registrationsPath) {
      extraChanges.push(
        insertImport(
          sourceFile,
          appConfigPath,
          'componentRegistrationsProvider',
          registrationsImportPath,
          false,
        ),
      );
    }
    if (!hasComponentRegistrationsProvider) {
      newElements.push(
        factory.createIdentifier('componentRegistrationsProvider'),
      );
    }
  }

  const didChange =
    newElements.length !== existingElements.length ||
    newElements.some((el, i) => compareElements(el, i, existingElements));

  const updatedProvidersArray = didChange
    ? factory.updateArrayLiteralExpression(providersArray, newElements)
    : providersArray;

  return { updatedProvidersArray, extraChanges, didChange };
}

/** Tiny utility to safely replace a node via the TS printer. */
export function replaceNodeWithPrinted(
  sf: SourceFile,
  filePath: string,
  fileText: string,
  original: Node,
  replacement: Node,
): Change[] {
  const printer = createPrinter({});
  const printed = printer.printNode(EmitHint.Unspecified, replacement, sf);
  const start = original.getStart(sf);
  const end = original.getEnd();
  return [
    new ReplaceChange(filePath, start, fileText.slice(start, end), printed),
  ];
}
