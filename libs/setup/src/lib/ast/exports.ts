import { Tree } from '@angular-devkit/schematics';
import {
  Declaration,
  ExportDeclaration,
  getCombinedModifierFlags,
  isClassDeclaration,
  isEnumDeclaration,
  isExportDeclaration,
  isFunctionDeclaration,
  isIdentifier,
  isNamedExports,
  isStringLiteral,
  isVariableStatement,
  ModifierFlags,
  NamedExportBindings,
  Statement,
} from 'typescript';
import { posix } from 'node:path';
import { loadSourceFile } from './parse';

/**
 * By name or through `export *` from a file in the tree. Whatever `export *` names
 * outside the tree does not count, as nothing there can be checked.
 */
export function exportsIdentifier(
  tree: Tree,
  filePath: string,
  identifier: string,
  visited = new Set<string>(),
): boolean {
  const sourceFile = visited.has(filePath)
    ? undefined
    : loadSourceFile(tree, filePath);

  visited.add(filePath);

  return (
    !!sourceFile &&
    sourceFile.statements.some((statement) =>
      isStarExport(statement)
        ? starTargetExports(tree, filePath, statement, identifier, visited)
        : statementExports(statement, identifier),
    )
  );
}

function isStarExport(statement: Statement): statement is ExportDeclaration {
  return (
    isExportDeclaration(statement) &&
    !statement.exportClause &&
    !statement.isTypeOnly
  );
}

function starTargetExports(
  tree: Tree,
  filePath: string,
  { moduleSpecifier }: ExportDeclaration,
  identifier: string,
  visited: Set<string>,
) {
  const target =
    moduleSpecifier &&
    isStringLiteral(moduleSpecifier) &&
    relativeModuleFile(tree, filePath, moduleSpecifier.text);

  return !!target && exportsIdentifier(tree, target, identifier, visited);
}

/** The file of a relative module specifier, as a TypeScript path lookup finds it. */
function relativeModuleFile(
  tree: Tree,
  fromFile: string,
  specifier: string,
): string | undefined {
  const target = posix.join(posix.dirname(fromFile), specifier);

  return specifier.startsWith('.')
    ? [`${target}.ts`, posix.join(target, 'index.ts')].find((file) =>
        tree.exists(file),
      )
    : undefined;
}

function statementExports(statement: Statement, identifier: string) {
  return isExportDeclaration(statement)
    ? !statement.isTypeOnly &&
        !!statement.exportClause &&
        exportClauseHas(statement.exportClause, identifier)
    : declaredNames(statement).includes(identifier);
}

function exportClauseHas(clause: NamedExportBindings, identifier: string) {
  return isNamedExports(clause)
    ? clause.elements.some(({ name }) => name.text === identifier)
    : clause.name.text === identifier;
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
