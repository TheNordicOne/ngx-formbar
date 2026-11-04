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
  isImportDeclaration,
  isNamedExports,
  isNamedImports,
  isStringLiteral,
  isVariableStatement,
  ModifierFlags,
  NamedExportBindings,
  SourceFile,
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

/** Where a name of a module comes from, under the name it has there. */
export interface ExportOrigin {
  filePath: string;
  className: string;
}

/**
 * The declaration that `identifier` of a module stands for, following re-exports
 * and their renames. `resolve` finds the file of a module specifier.
 */
export function declarationOf(
  tree: Tree,
  identifier: string,
  resolve: (specifier: string, fromFile: string) => string | undefined,
  specifier: string,
  fromFile: string,
  visited = new Set<string>(),
): ExportOrigin | undefined {
  const filePath = resolve(specifier, fromFile);
  const sourceFile =
    filePath && !visited.has(filePath)
      ? loadSourceFile(tree, filePath)
      : undefined;

  if (!filePath || !sourceFile) {
    return undefined;
  }

  visited.add(filePath);

  const follow = (name: string, next: string) =>
    declarationOf(tree, name, resolve, next, filePath, visited);
  const exportDeclarations = sourceFile.statements
    .filter(isExportDeclaration)
    .filter(({ isTypeOnly }) => !isTypeOnly);
  const localName = exportDeclarations
    .filter(({ moduleSpecifier }) => !moduleSpecifier)
    .flatMap((declaration) => namesBehind(declaration, identifier))
    .at(0);
  const imported = localName && importOf(sourceFile, localName);

  if (imported) {
    return follow(imported.name, imported.specifier);
  }

  const declaredHere =
    !!localName ||
    sourceFile.statements.some(
      (statement) =>
        !isExportDeclaration(statement) &&
        declaredNames(statement).includes(identifier),
    );

  return declaredHere
    ? { filePath, className: localName ?? identifier }
    : exportDeclarations
        .flatMap((declaration) => {
          const { moduleSpecifier } = declaration;

          return moduleSpecifier && isStringLiteral(moduleSpecifier)
            ? namesBehind(declaration, identifier).map((name) =>
                follow(name, moduleSpecifier.text),
              )
            : [];
        })
        .find(Boolean);
}

/** What an export calls `identifier` on its other side. A namespace is no such name. */
function namesBehind({ exportClause }: ExportDeclaration, identifier: string) {
  return !exportClause
    ? [identifier]
    : isNamedExports(exportClause)
      ? exportClause.elements
          .filter(
            ({ name, isTypeOnly }) => !isTypeOnly && name.text === identifier,
          )
          .map(({ name, propertyName }) => (propertyName ?? name).text)
      : [];
}

function importOf({ statements }: SourceFile, localName: string) {
  return statements
    .filter(isImportDeclaration)
    .flatMap(({ importClause, moduleSpecifier }) => {
      const bindings = importClause?.namedBindings;

      return bindings &&
        isNamedImports(bindings) &&
        isStringLiteral(moduleSpecifier)
        ? bindings.elements
            .filter(({ name }) => name.text === localName)
            .map(({ name, propertyName }) => ({
              name: (propertyName ?? name).text,
              specifier: moduleSpecifier.text,
            }))
        : [];
    })
    .at(0);
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
function relativeModuleFile(tree: Tree, fromFile: string, specifier: string) {
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
    ? clause.elements.some(
        ({ name, isTypeOnly }) => !isTypeOnly && name.text === identifier,
      )
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
