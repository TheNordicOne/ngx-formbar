import {
  Expression,
  ImportSpecifier,
  isArrayLiteralExpression,
  isCallExpression,
  isIdentifier,
  isImportDeclaration,
  isNamedImports,
  isNewExpression,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isStringLiteral,
  isVariableDeclaration,
  isVariableStatement,
  Node,
  ObjectLiteralElementLike,
  ObjectLiteralExpression,
  SourceFile,
  SyntaxKind,
} from 'typescript';
import { UnitTestTree } from '@angular-devkit/schematics/testing';
import { isCallee } from '../shared/ast';

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

  const visit = (node: Node): void => {
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

  const visit = (node: Node): void => {
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

  const visit = (node: Node): void => {
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
  const visit = (node: Node): void => {
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

  const visit = (node: Node): void => {
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
): void {
  if (array.length === 0) {
    throw new Error('Array.forEach did not iterate at least once.');
  }
  array.forEach(callback);
}

// Counts the number of Identifier nodes in the entire SourceFile that match the provided name.
export function countIdentifier(sf: SourceFile, name: string): number {
  let count = 0;
  const visit = (node: Node): void => {
    if (isIdentifier(node) && node.text === name) {
      count += 1;
    }
    node.forEachChild(visit);
  };
  sf.forEachChild(visit);
  return count;
}

// Counts how many times a given Identifier appears directly inside any `providers: [...]` array.
export function countProvidersArrayIdentifiers(
  sf: SourceFile,
  name: string,
): number {
  let count = 0;

  const visit = (node: Node): void => {
    if (
      isPropertyAssignment(node) &&
      isIdentifier(node.name) &&
      node.name.text === 'providers'
    ) {
      const init = node.initializer;
      if (isArrayLiteralExpression(init)) {
        const items = init.elements;
        items.forEach((el) => {
          if (isIdentifier(el) && el.text === name) {
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

// --- Count variants for specific *HasIdentifier scenarios ---

function matchesIdentifierName(
  p: ObjectLiteralElementLike,
  key: string,
  identifierName: string,
) {
  if (!isPropertyAssignment(p)) {
    return false;
  }

  const n = p.name;
  const matchesKey =
    (isIdentifier(n) && n.text === key) ||
    (isStringLiteral(n) && n.text === key);

  return (
    matchesKey &&
    isIdentifier(p.initializer) &&
    p.initializer.text === identifierName
  );
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

// Count entries inside provideFormwork({ componentRegistrations: { [key]: Identifier } })
export function countProvideFormworkComponentRegistrationsIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
): number {
  let count = 0;

  const visit = (node: Node): void => {
    if (
      isCallExpression(node) &&
      isCallee(node.expression, 'provideFormwork')
    ) {
      const [firstArg] = node.arguments;
      if (!isObjectLiteralExpression(firstArg)) {
        node.forEachChild(visit);
        return;
      }

      const regProp = firstArg.properties.find((p) => {
        if (!isPropertyAssignment(p)) return false;
        const n = p.name;
        return (
          (isIdentifier(n) && n.text === 'componentRegistrations') ||
          (isStringLiteral(n) && n.text === 'componentRegistrations')
        );
      });

      if (
        !regProp ||
        !isPropertyAssignment(regProp) ||
        !isObjectLiteralExpression(regProp.initializer)
      ) {
        node.forEachChild(visit);
        return;
      }

      regProp.initializer.properties.forEach((p) => {
        if (matchesIdentifierName(p, key, identifierName)) {
          count += 1;
        }
      });
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return count;
}

// Count entries inside defineFormworkConfig({ componentRegistrations: { [key]: Identifier } })
export function countDefineFormworkConfigComponentRegistrationsIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
): number {
  let count = 0;

  const visit = (node: Node): void => {
    if (
      isCallExpression(node) &&
      isCallee(node.expression, 'defineFormworkConfig')
    ) {
      const [firstArg] = node.arguments;
      if (!isObjectLiteralExpression(firstArg)) {
        node.forEachChild(visit);
        return;
      }

      const regProp = firstArg.properties.find(
        (p) =>
          isPropertyAssignment(p) &&
          isIdentifier(p.name) &&
          p.name.text === 'componentRegistrations',
      );

      if (
        !regProp ||
        !isPropertyAssignment(regProp) ||
        !isObjectLiteralExpression(regProp.initializer)
      ) {
        node.forEachChild(visit);
        return;
      }

      regProp.initializer.properties.forEach((p) => {
        if (matchesIdentifierName(p, key, identifierName)) {
          count += 1;
        }
      });
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return count;
}

// Count entries inside variable componentRegistrationsProvider = { useValue: new Map([[key, Identifier], ...]) }
export function countComponentRegistrationsMapProviderIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
): number {
  let count = 0;

  const visit = (node: Node): void => {
    if (isVariableStatement(node)) {
      const decls = node.declarationList.declarations;
      for (const decl of decls) {
        if (
          !isIdentifier(decl.name) ||
          decl.name.text !== 'componentRegistrationsProvider'
        ) {
          continue;
        }

        const init = decl.initializer;
        if (!init || !isObjectLiteralExpression(init)) {
          continue;
        }

        const useValueProp = init.properties.find(
          (p) =>
            isPropertyAssignment(p) &&
            isIdentifier(p.name) &&
            p.name.text === 'useValue',
        );

        if (!useValueProp || !isPropertyAssignment(useValueProp)) {
          continue;
        }

        const mapExpr = useValueProp.initializer;
        if (
          !isNewExpression(mapExpr) ||
          !mapExpr.arguments ||
          mapExpr.arguments.length === 0
        ) {
          continue;
        }

        const mapArg = mapExpr.arguments[0];
        if (!isArrayLiteralExpression(mapArg)) {
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

// Count entries inside variable componentRegistrations = { [key]: Identifier }
export function countDirectComponentRegistrationsIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
): number {
  let count = 0;

  const visit = (node: Node): void => {
    if (isVariableStatement(node)) {
      const decls = node.declarationList.declarations;
      for (const decl of decls) {
        if (
          !isIdentifier(decl.name) ||
          decl.name.text !== 'componentRegistrations'
        ) {
          continue;
        }

        const init = decl.initializer;
        if (!init || !isObjectLiteralExpression(init)) {
          continue;
        }

        init.properties.forEach((p) => {
          if (matchesIdentifierName(p, key, identifierName)) {
            count += 1;
          }
        });
        // Do not early-return; there could technically be multiple such declarations
      }
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return count;
}

// Count entries inside appConfig.providers providing NGX_FW_COMPONENT_REGISTRATIONS via useValue: new Map([[key, Identifier]])
export function countAppConfigProvidersComponentRegistrationsMapIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
): number {
  let count = 0;

  const visit = (node: Node): void => {
    if (!isVariableStatement(node)) {
      node.forEachChild(visit);
      return;
    }

    const decls = node.declarationList.declarations;
    for (const decl of decls) {
      if (
        !isVariableDeclaration(decl) ||
        !isIdentifier(decl.name) ||
        decl.name.text !== 'appConfig' ||
        !decl.initializer
      ) {
        continue;
      }

      if (!isObjectLiteralExpression(decl.initializer)) {
        continue;
      }

      const providersProperty = decl.initializer.properties.find(
        (prop) =>
          isPropertyAssignment(prop) &&
          isIdentifier(prop.name) &&
          prop.name.text === 'providers',
      );

      if (
        !providersProperty ||
        !isPropertyAssignment(providersProperty) ||
        !isArrayLiteralExpression(providersProperty.initializer)
      ) {
        continue;
      }

      const providersArray = providersProperty.initializer;
      for (const element of providersArray.elements) {
        if (!isObjectLiteralExpression(element)) continue;

        const provideProp = element.properties.find(
          (p) =>
            isPropertyAssignment(p) &&
            isIdentifier(p.name) &&
            p.name.text === 'provide' &&
            isIdentifier(p.initializer) &&
            p.initializer.text === 'NGX_FW_COMPONENT_REGISTRATIONS',
        );

        if (!provideProp) continue;

        const useValueProp = element.properties.find(
          (p) =>
            isPropertyAssignment(p) &&
            isIdentifier(p.name) &&
            p.name.text === 'useValue',
        );

        if (
          !useValueProp ||
          !isPropertyAssignment(useValueProp) ||
          !isNewExpression(useValueProp.initializer)
        ) {
          continue;
        }

        const mapExpr = useValueProp.initializer;
        if (
          !mapExpr.arguments ||
          mapExpr.arguments.length === 0 ||
          !isArrayLiteralExpression(mapExpr.arguments[0])
        ) {
          continue;
        }

        const mapArg = mapExpr.arguments[0];
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
