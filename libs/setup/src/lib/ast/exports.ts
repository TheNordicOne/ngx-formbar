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
  NamedExportBindings,
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
  return isExportDeclaration(statement)
    ? !statement.isTypeOnly &&
        exportClauseHas(statement.exportClause, identifier)
    : declaredNames(statement).includes(identifier);
}

/** No clause at all is `export *`. */
function exportClauseHas(
  clause: NamedExportBindings | undefined,
  identifier: string,
) {
  return (
    !clause ||
    (isNamedExports(clause)
      ? clause.elements.some(({ name }) => name.text === identifier)
      : clause.name.text === identifier)
  );
}

function declaredNames(statement: Statement) {
  return isVariableStatement(statement)
    ? statement.declarationList.declarations.flatMap((declaration) =>
        isExported(declaration) && isIdentifier(declaration.name)
          ? [declaration.name.text]
          : [],
      )
    : (isFunctionDeclaration(statement) ||
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
