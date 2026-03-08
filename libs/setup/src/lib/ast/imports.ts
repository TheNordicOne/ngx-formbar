import {
  ImportSpecifier,
  isImportDeclaration,
  isNamedImports,
  isNamespaceImport,
  isStringLiteral,
  Node,
  SourceFile,
} from 'typescript';
import { normalize, Path } from '@angular-devkit/core';
import { buildRelativePath } from '@schematics/angular/utility/find-module';

export function hasNamedImport(
  sf: SourceFile,
  moduleName: string,
  imported: string,
) {
  let found = false;
  if (moduleName.endsWith('.ts')) {
    moduleName = moduleName.split('.ts')[0];
  }
  sf.forEachChild((n) => {
    if (found) {
      return;
    }
    if (!isImportDeclaration(n)) {
      return;
    }
    const mod = n.moduleSpecifier;
    if (!isStringLiteral(mod) || mod.text !== moduleName) {
      return;
    }
    const named = n.importClause?.namedBindings;
    if (!named || !isNamedImports(named)) {
      return;
    }
    found = named.elements.some((el) => el.name.text === imported);
  });
  return found;
}

export function importForSymbolUsesCorrectRelativePath(
  sf: SourceFile,
  fromFilePath: string,
  symbolName: string,
  targetFilePath: string,
) {
  const fromPath = fromFilePath.startsWith('/')
    ? fromFilePath
    : `/${fromFilePath}`;
  const toPath = targetFilePath.startsWith('/')
    ? targetFilePath
    : `/${targetFilePath}`;
  const expectedRaw = buildRelativePath(fromPath, toPath);
  let expected = normalize(expectedRaw);

  if (expected.endsWith('.ts')) {
    expected = expected.split('.ts')[0] as Path;
  }

  let found = false;

  const visit = (node: Node): void => {
    if (found) return;

    if (!isImportDeclaration(node)) {
      node.forEachChild(visit);
      return;
    }

    const ms = node.moduleSpecifier;
    if (!isStringLiteral(ms) || normalize(ms.text) !== expected) {
      node.forEachChild(visit);
      return;
    }

    const clause = node.importClause;
    if (!clause) {
      node.forEachChild(visit);
      return;
    }

    if (clause.name && clause.name.text === symbolName) {
      found = true;
      return;
    }

    const nb = clause.namedBindings;
    if (!nb) {
      node.forEachChild(visit);
      return;
    }

    if (isNamedImports(nb)) {
      const hit = nb.elements.some((el: ImportSpecifier) => {
        const exported = (el.propertyName ?? el.name).text;
        const local = el.name.text;
        return exported === symbolName || local === symbolName;
      });

      if (hit) {
        found = true;
        return;
      }
    }

    if (isNamespaceImport(nb) && nb.name.text === symbolName) {
      found = true;
      return;
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}
