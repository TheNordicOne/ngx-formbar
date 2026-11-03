import { Tree } from '@angular-devkit/schematics';
import {
  Declaration,
  getCombinedModifierFlags,
  isClassDeclaration,
  isEnumDeclaration,
  isExportDeclaration,
  isFunctionDeclaration,
  isIdentifier,
  isNamedExports,
  isVariableStatement,
  ModifierFlags,
  Statement,
} from 'typescript';
import { loadSourceFile } from './parse';

/** By name or through `export *`, which is taken at its word. */
export function exportsIdentifier(
  tree: Tree,
  filePath: string,
  identifier: string,
): boolean {
  const sourceFile = loadSourceFile(tree, filePath);

  return (
    !!sourceFile &&
    sourceFile.statements.some((statement) =>
      statementExports(statement, identifier),
    )
  );
}

function statementExports(statement: Statement, identifier: string) {
  if (isExportDeclaration(statement)) {
    const { exportClause, isTypeOnly } = statement;

    return (
      !isTypeOnly &&
      (!exportClause ||
        (isNamedExports(exportClause)
          ? exportClause.elements.some(({ name }) => name.text === identifier)
          : exportClause.name.text === identifier))
    );
  }

  return declaredNames(statement).includes(identifier);
}

function declaredNames(statement: Statement) {
  if (isVariableStatement(statement)) {
    return statement.declarationList.declarations.flatMap((declaration) =>
      isExported(declaration) && isIdentifier(declaration.name)
        ? [declaration.name.text]
        : [],
    );
  }

  return (isFunctionDeclaration(statement) ||
    isClassDeclaration(statement) ||
    isEnumDeclaration(statement)) &&
    isExported(statement) &&
    statement.name
    ? [statement.name.text]
    : [];
}

function isExported(declaration: Declaration) {
  return !!(getCombinedModifierFlags(declaration) & ModifierFlags.Export);
}
