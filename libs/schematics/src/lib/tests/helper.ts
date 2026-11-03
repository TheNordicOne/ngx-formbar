import {
  ArrayLiteralExpression,
  createSourceFile,
  Expression,
  forEachChild,
  ImportSpecifier,
  isArrayLiteralExpression,
  isCallExpression,
  isClassDeclaration,
  isIdentifier,
  isImportDeclaration,
  isInterfaceDeclaration,
  isLiteralTypeNode,
  isNamedImports,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isPropertySignature,
  isStringLiteral,
  isVariableStatement,
  Node,
  isNamespaceImport,
  isNewExpression,
  isVariableDeclaration,
  ObjectLiteralElementLike,
  ObjectLiteralExpression,
  ScriptTarget,
  SourceFile,
  SyntaxKind,
  VariableDeclaration,
} from 'typescript';
import { UnitTestTree } from '@angular-devkit/schematics/testing';
import {
  extractComponentNameFromLazyImport,
  isCallee,
  NGX_FW_COMPONENT_REGISTRATIONS,
} from '@ngx-formbar/setup';
import { normalize } from '@angular-devkit/core';
import { buildRelativePath } from '@schematics/angular/utility/find-module';

// Path helpers
export function appRoot(p = ''): string {
  return `/projects/test-app${p ? `/${p}` : ''}`;
}
export function src(p = ''): string {
  return appRoot(`src/${p}`);
}
export function app(p = ''): string {
  return src(`app/${p}`);
}

// FS helpers
export function read(tree: UnitTestTree, path: string): string {
  return tree.readText(normalize(path)).replace(/\r\n/g, '\n');
}

export function exists(tree: UnitTestTree, path: string): boolean {
  console.log();
  return tree.exists(normalize(path));
}

export function writeJson(
  tree: UnitTestTree,
  filePath: string,
  value: unknown,
): void {
  const content = JSON.stringify(value);
  if (tree.exists(filePath)) {
    tree.overwrite(normalize(filePath), content);
    return;
  }
  tree.create(normalize(filePath), content);
}

export function writeTs(
  tree: UnitTestTree,
  filePath: string,
  content: string,
): void {
  if (tree.exists(normalize(filePath))) {
    tree.overwrite(normalize(filePath), content);
    return;
  }
  tree.create(normalize(filePath), content);
}

export function providersArrayContainsCall(
  sf: SourceFile,
  callee: string,
): boolean {
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

export function providersArrayContainsIdentifier(
  sf: SourceFile,
  name: string,
): boolean {
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
): boolean {
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
): number {
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

export function countCall(sf: SourceFile, callee: string): number {
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
): boolean {
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
): boolean {
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

export function hasDynamicImportOf(
  sf: SourceFile,
  componentClassName: string,
): boolean {
  let found = false;

  const visit = (node: Node) => {
    if (found) return;
    if (extractComponentNameFromLazyImport(node) === componentClassName) {
      found = true;
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

export function classDeclarationExists(
  sf: SourceFile,
  className: string,
): boolean {
  return findClass(sf, className) !== undefined;
}

export function classImplementsInterface(
  sf: SourceFile,
  className: string,
  interfaceName: string,
): boolean {
  return (findClass(sf, className)?.heritageClauses ?? [])
    .filter((clause) => clause.token === SyntaxKind.ImplementsKeyword)
    .flatMap((clause) => clause.types)
    .some(
      ({ expression }) =>
        isIdentifier(expression) && expression.text === interfaceName,
    );
}

export function interfaceHasTypeLiteral(
  sf: SourceFile,
  interfaceName: string,
  typeLiteral: string,
): boolean {
  const declaration = findNode(
    sf,
    isInterfaceDeclaration,
    (candidate) => candidate.name.text === interfaceName,
  );

  return (declaration?.members ?? []).some(
    (member) =>
      isPropertySignature(member) &&
      isIdentifier(member.name) &&
      member.name.text === 'type' &&
      member.type !== undefined &&
      isLiteralTypeNode(member.type) &&
      isStringLiteral(member.type.literal) &&
      member.type.literal.text === typeLiteral,
  );
}

function findClass(sf: SourceFile, className: string) {
  return findNode(
    sf,
    isClassDeclaration,
    (candidate) => candidate.name?.text === className,
  );
}

function findNode<T extends Node>(
  node: Node,
  is: (candidate: Node) => candidate is T,
  matches: (candidate: T) => boolean,
): T | undefined {
  return forEachChild(node, (child) =>
    is(child) && matches(child) ? child : findNode(child, is, matches),
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
    ((isIdentifier(valueEl) && valueEl.text === identifierName) ||
      extractComponentNameFromLazyImport(valueEl) === identifierName)
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

export function parseTS(code: string): SourceFile {
  return createSourceFile('temp.ts', code, ScriptTarget.Latest, true);
}

export function hasNamedImport(
  sf: SourceFile,
  moduleName: string,
  imported: string,
): boolean {
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
): boolean {
  const fromPath = fromFilePath.startsWith('/')
    ? fromFilePath
    : `/${fromFilePath}`;
  const toPath = targetFilePath.startsWith('/')
    ? targetFilePath
    : `/${targetFilePath}`;
  const expected = normalize(buildRelativePath(fromPath, toPath)).replace(
    /\.ts$/,
    '',
  );

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

    if (clause.name?.text === symbolName) {
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

export function getDecoratorObject(
  sf: SourceFile,
  decoratorName: string,
): ObjectLiteralExpression | undefined {
  let found: ObjectLiteralExpression | undefined;

  const visit = (node: Node): void => {
    if (found) {
      return;
    }

    if (
      isCallExpression(node) &&
      isCallee(node.expression, decoratorName) &&
      node.arguments.length > 0
    ) {
      const [firstArg] = node.arguments;
      if (isObjectLiteralExpression(firstArg)) {
        found = firstArg;
        return;
      }
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function decoratorPropInitializerIsIdentifier(
  sf: SourceFile,
  decoratorName: string,
  propName: string,
  identifierName: string,
): boolean {
  const obj = getDecoratorObject(sf, decoratorName);
  if (!obj) {
    return false;
  }

  const prop = obj.properties.find((p) => {
    if (!isPropertyAssignment(p)) {
      return false;
    }
    const n = p.name;
    return (
      (isIdentifier(n) && n.text === propName) ||
      (isStringLiteral(n) && n.text === propName)
    );
  });

  if (!prop || !isPropertyAssignment(prop)) {
    return false;
  }
  return (
    isIdentifier(prop.initializer) && prop.initializer.text === identifierName
  );
}

export function getDecoratorArrayProp(
  sf: SourceFile,
  decoratorName: string,
  propName: string,
): ArrayLiteralExpression | undefined {
  const obj = getDecoratorObject(sf, decoratorName);
  if (!obj) {
    return undefined;
  }

  const prop = obj.properties.find((p) => {
    if (!isPropertyAssignment(p)) {
      return false;
    }
    const n = p.name;
    return (
      (isIdentifier(n) && n.text === propName) ||
      (isStringLiteral(n) && n.text === propName)
    );
  });

  if (!prop || !isPropertyAssignment(prop)) {
    return undefined;
  }

  return isArrayLiteralExpression(prop.initializer)
    ? prop.initializer
    : undefined;
}

export function decoratorHasProp(
  sf: SourceFile,
  decoratorName: string,
  propName: string,
): boolean {
  const obj = getDecoratorObject(sf, decoratorName);
  if (!obj) {
    return false;
  }

  return obj.properties.some((p) => {
    if (!isPropertyAssignment(p)) {
      return false;
    }
    const n = p.name;
    return (
      (isIdentifier(n) && n.text === propName) ||
      (isStringLiteral(n) && n.text === propName)
    );
  });
}

export function componentSelectorEquals(
  sf: SourceFile,
  expected: string,
): boolean {
  const obj = getDecoratorObject(sf, 'Component');
  if (!obj) {
    return false;
  }

  const prop = obj.properties.find((p) => {
    if (!isPropertyAssignment(p)) {
      return false;
    }
    const n = p.name;
    return (
      (isIdentifier(n) && n.text === 'selector') ||
      (isStringLiteral(n) && n.text === 'selector')
    );
  });

  if (!prop || !isPropertyAssignment(prop)) {
    return false;
  }

  const init = prop.initializer;
  if (!isStringLiteral(init)) {
    return false;
  }

  return init.text === expected;
}

export function getProvideFormbarArg(
  sf: SourceFile,
): ObjectLiteralExpression | undefined {
  let result: ObjectLiteralExpression | undefined;

  const visit = (node: Node): void => {
    if (result) {
      return;
    }

    if (isCallExpression(node) && isCallee(node.expression, 'provideFormbar')) {
      if (
        node.arguments.length > 0 &&
        isObjectLiteralExpression(node.arguments[0])
      ) {
        result = node.arguments[0];
        return;
      }
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return result;
}

export function matchesIdentifierName(
  p: ObjectLiteralElementLike,
  key: string,
  identifierName: string,
): boolean {
  if (!isPropertyAssignment(p)) {
    return false;
  }

  const n = p.name;
  const matchesKey =
    (isIdentifier(n) && n.text === key) ||
    (isStringLiteral(n) && n.text === key);

  return (
    matchesKey &&
    (isIdentifier(p.initializer)
      ? p.initializer.text === identifierName
      : extractComponentNameFromLazyImport(p.initializer) === identifierName)
  );
}

export function provideFormbarComponentRegistrationsHasIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
): boolean {
  const arg = getProvideFormbarArg(sf);
  if (!arg) {
    return false;
  }

  const regProp = arg.properties.find((p) => {
    if (!isPropertyAssignment(p)) {
      return false;
    }
    const n = p.name;
    return (
      (isIdentifier(n) && n.text === 'componentRegistrations') ||
      (isStringLiteral(n) && n.text === 'componentRegistrations')
    );
  });

  if (!regProp || !isPropertyAssignment(regProp)) {
    return false;
  }

  const nested = regProp.initializer;
  if (!isObjectLiteralExpression(nested)) {
    return false;
  }

  const entry = nested.properties.find((p) => {
    if (!isPropertyAssignment(p)) {
      return false;
    }
    const n = p.name;
    const matchesKey =
      (isIdentifier(n) && n.text === key) ||
      (isStringLiteral(n) && n.text === key);
    if (!matchesKey) {
      return false;
    }
    return (
      (isIdentifier(p.initializer) && p.initializer.text === identifierName) ||
      extractComponentNameFromLazyImport(p.initializer) === identifierName
    );
  });

  return !!entry;
}

export function defineFormbarConfigComponentRegistrationsHasIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
): boolean {
  let found = false;

  const visit = (node: Node): void => {
    if (found) return;

    if (
      isCallExpression(node) &&
      isCallee(node.expression, 'defineFormbarConfig')
    ) {
      const [firstArg] = node.arguments;
      if (node.arguments.length === 0 || !isObjectLiteralExpression(firstArg)) {
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

      found = regProp.initializer.properties.some((p) => {
        return matchesIdentifierName(p, key, identifierName);
      });

      return;
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function componentRegistrationsMapProviderHasIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
): boolean {
  let found = false;

  const visit = (node: Node): void => {
    if (found) return;

    if (isVariableStatement(node)) {
      const decls = node.declarationList.declarations;
      for (const decl of decls) {
        const mapArg = getMapArguments(decl);
        if (!mapArg) {
          continue;
        }
        found = mapArg.elements.some((el) => {
          return isArrayAndMatchesIdentifierName(el, key, identifierName);
        });

        if (found) return;
      }
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function directComponentRegistrationsHasIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
): boolean {
  let found = false;

  const visit = (node: Node): void => {
    if (found) return;

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

        found = init.properties.some((p) => {
          return matchesIdentifierName(p, key, identifierName);
        });

        return;
      }
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function appConfigProvidersComponentRegistrationsMapHasIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
): boolean {
  let found = false;

  const visit = (node: Node): void => {
    if (found) return;

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
            p.initializer.text === NGX_FW_COMPONENT_REGISTRATIONS,
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
        found = mapArg.elements.some((el) => {
          return isArrayAndMatchesIdentifierName(el, key, identifierName);
        });

        if (found) return;
      }
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function getMapArguments(
  decl: VariableDeclaration,
): ArrayLiteralExpression | null {
  if (
    !isIdentifier(decl.name) ||
    decl.name.text !== 'componentRegistrationsProvider'
  ) {
    return null;
  }

  const init = decl.initializer;
  if (!init || !isObjectLiteralExpression(init)) {
    return null;
  }

  const useValueProp = init.properties.find(
    (p) =>
      isPropertyAssignment(p) &&
      isIdentifier(p.name) &&
      p.name.text === 'useValue',
  );

  if (!useValueProp || !isPropertyAssignment(useValueProp)) {
    return null;
  }

  const mapExpr = useValueProp.initializer;
  if (
    !isNewExpression(mapExpr) ||
    !mapExpr.arguments ||
    mapExpr.arguments.length === 0
  ) {
    return null;
  }

  const mapArg = mapExpr.arguments[0];
  if (!isArrayLiteralExpression(mapArg)) {
    return null;
  }
  return mapArg;
}
