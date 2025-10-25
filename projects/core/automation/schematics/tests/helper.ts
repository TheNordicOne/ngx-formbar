import {
  Expression,
  ImportSpecifier,
  isArrayLiteralExpression,
  isCallExpression,
  isIdentifier,
  isImportDeclaration,
  isNamedImports,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isStringLiteral,
  isVariableStatement,
  Node,
  ObjectLiteralExpression,
  SourceFile,
  SyntaxKind,
} from 'typescript';
import { UnitTestTree } from '@angular-devkit/schematics/testing';
import { isCallee } from '../shared/ast/decorators';
import { getMapArguments } from '../shared/ast/registrations';

// Path helpers
export function appRoot(p = '') {
  return `/projects/test-app${p ? `/${p}` : ''}`;
}
export function src(p = '') {
  return appRoot(`src/${p}`);
}
export function app(p = '') {
  return src(`app/${p}`);
}

// FS helpers
export function read(tree: UnitTestTree, path: string) {
  return tree.readText(path).replace(/\r\n/g, '\n');
}

export function writeJson(
  tree: UnitTestTree,
  filePath: string,
  value: unknown,
) {
  const content = JSON.stringify(value);
  if (tree.exists(filePath)) {
    tree.overwrite(filePath, content);
    return;
  }
  tree.create(filePath, content);
}

export function writeTs(tree: UnitTestTree, filePath: string, content: string) {
  if (tree.exists(filePath)) {
    tree.overwrite(filePath, content);
    return;
  }
  tree.create(filePath, content);
}

export function providersArrayContainsCall(sf: SourceFile, callee: string) {
  let found = false;

  const visit = (node: Node) => {
    if (found) {
      return;
    }

    if (
      isPropertyAssignment(node) &&
      isIdentifier(node.name) &&
      node.name.text === 'providers'
    ) {
      const init = node.initializer;
      if (isArrayLiteralExpression(init)) {
        const items = init.elements;
        found = items.some((el) => {
          if (isCallExpression(el) && isIdentifier(el.expression)) {
            return el.expression.text === callee;
          }
          return false;
        });
      }
    }
    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function providersArrayContainsIdentifier(sf: SourceFile, name: string) {
  let found = false;

  const visit = (node: Node) => {
    if (found) {
      return;
    }

    if (
      isPropertyAssignment(node) &&
      isIdentifier(node.name) &&
      node.name.text === 'providers'
    ) {
      const init = node.initializer;
      if (isArrayLiteralExpression(init)) {
        const items = init.elements;
        found = items.some((el) => {
          return isIdentifier(el) && el.text === name;
        });
      }
    }
    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function providersArrayContainsProviderObject(
  sf: SourceFile,
  tokenName: string,
) {
  let found = false;

  const visit = (node: Node) => {
    if (found) {
      return;
    }

    if (
      isPropertyAssignment(node) &&
      isIdentifier(node.name) &&
      node.name.text === 'providers'
    ) {
      const init = node.initializer;
      if (!isArrayLiteralExpression(init)) {
        node.forEachChild(visit);
        return;
      }

      found = init.elements.some((el) => {
        if (!isObjectLiteralExpression(el)) {
          return false;
        }

        return el.properties.find((p) => {
          if (!isPropertyAssignment(p)) {
            return false;
          }

          const n = p.name;
          const isProvide =
            (isIdentifier(n) && n.text === 'provide') ||
            (isStringLiteral(n) && n.text === 'provide');

          if (!isProvide) {
            return false;
          }

          const init = p.initializer;
          if (!isIdentifier(init)) {
            return false;
          }
          return init.text === tokenName;
        });
      });

      return;
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function countNamedImport(
  sf: SourceFile,
  moduleName: string,
  imported: string,
) {
  let count = 0;
  sf.forEachChild((n) => {
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
    const hasImported = named.elements.some(
      (el: ImportSpecifier) => el.name.text === imported,
    );
    if (hasImported) {
      count += 1;
    }
  });
  return count;
}

export function countCall(sf: SourceFile, callee: string) {
  let count = 0;
  const visit = (node: Node) => {
    if (
      isCallExpression(node) &&
      isIdentifier(node.expression) &&
      node.expression.text === callee
    ) {
      count += 1;
    }
    node.forEachChild(visit);
  };
  sf.forEachChild(visit);
  return count;
}

type PropShape = 'shorthand' | 'object' | 'identifier';

export function objectHasPropOfKind(
  obj: ObjectLiteralExpression,
  propName: string,
  kind?: PropShape,
) {
  return obj.properties.some((p) => {
    switch (p.kind) {
      case SyntaxKind.ShorthandPropertyAssignment: {
        if (p.name.text !== propName) {
          return false;
        }
        return kind ? kind === 'shorthand' : true;
      }

      case SyntaxKind.PropertyAssignment: {
        const n = p.name;
        const named =
          (isIdentifier(n) && n.text === propName) ||
          (isStringLiteral(n) && n.text === propName);
        if (!named) {
          return false;
        }

        if (!kind) {
          return true;
        }

        if (kind === 'object') {
          return isObjectLiteralExpression(p.initializer);
        }

        return false;
      }

      default: {
        return false;
      }
    }
  });
}

export function callObjectArgHasProp(
  sf: SourceFile,
  calleeName: string,
  propName: string,
  kind: PropShape,
) {
  let found = false;

  const visit = (node: Node) => {
    if (found) {
      return;
    }

    if (isCallExpression(node) && isCallee(node.expression, calleeName)) {
      const [firstArg] = node.arguments;

      if (
        kind === 'identifier' &&
        node.arguments.length > 0 &&
        isIdentifier(firstArg)
      ) {
        found = firstArg.text === propName;
        return;
      }

      if (node.arguments.length === 0 || !isObjectLiteralExpression(firstArg)) {
        node.forEachChild(visit);
        return;
      }

      found = objectHasPropOfKind(firstArg, propName, kind);
      return;
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function forEachAtLeastOnce<T>(
  array: readonly T[],
  callback: Parameters<(readonly T[])['forEach']>[0],
) {
  if (array.length === 0) {
    throw new Error('Array.forEach did not iterate at least once.');
  }
  array.forEach(callback);
}

function isArrayAndMatchesIdentifierName(
  el: Expression,
  key: string,
  identifierName: string,
) {
  if (!isArrayLiteralExpression(el) || el.elements.length !== 2) {
    return false;
  }

  const [keyEl, valueEl] = el.elements;
  return (
    isStringLiteral(keyEl) &&
    keyEl.text === key &&
    isIdentifier(valueEl) &&
    valueEl.text === identifierName
  );
}

// Count entries inside variable componentRegistrationsProvider = { useValue: new Map([[key, Identifier], ...]) }
export function countComponentRegistrationsMapProviderIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
): number {
  let count = 0;

  const visit = (node: Node) => {
    if (isVariableStatement(node)) {
      const decls = node.declarationList.declarations;
      for (const decl of decls) {
        const mapArg = getMapArguments(decl);
        if (!mapArg) {
          continue;
        }

        mapArg.elements.forEach((el) => {
          if (isArrayAndMatchesIdentifierName(el, key, identifierName)) {
            count += 1;
          }
        });
      }
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return count;
}
