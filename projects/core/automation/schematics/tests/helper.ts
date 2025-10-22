import {
  ArrayLiteralExpression,
  createSourceFile,
  Expression,
  ImportSpecifier,
  isArrayLiteralExpression,
  isCallExpression,
  isClassDeclaration,
  isIdentifier,
  isImportDeclaration,
  isInterfaceDeclaration,
  isLiteralTypeNode,
  isNamedImports,
  isNamespaceImport,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isPropertySignature,
  isStringLiteral,
  Node,
  ObjectLiteralExpression,
  ScriptTarget,
  SourceFile,
  StringLiteral,
  SyntaxKind,
} from 'typescript';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { normalize, Path } from '@angular-devkit/core';
import { UnitTestTree } from '@angular-devkit/schematics/testing';

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

// TS AST helpers
export function parseTS(code: string) {
  return createSourceFile('temp.ts', code, ScriptTarget.Latest, true);
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
) {
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

export function decoratorArrayPropContainsIdentifier(
  sf: SourceFile,
  decoratorName: string,
  propName: string,
  identifierName: string,
) {
  const arr = getDecoratorArrayProp(sf, decoratorName, propName);
  if (!arr) {
    return false;
  }

  return arr.elements.some((el) => {
    if (!isIdentifier(el)) {
      return false;
    }

    return el.text === identifierName;
  });
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

export function decoratorArrayPropContainsProviderObject(
  sf: SourceFile,
  decoratorName: string,
  propName: string,
  tokenName: string,
) {
  const arr = getDecoratorArrayProp(sf, decoratorName, propName);
  if (!arr) {
    return false;
  }

  return arr.elements.some((el) => {
    if (!isObjectLiteralExpression(el)) {
      return false;
    }

    const provideProp = el.properties.find((p) => {
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
      return isIdentifier(p.initializer) && p.initializer.text === tokenName;
    });

    return !!provideProp;
  });
}

export function decoratorHostDirectivesHasInlineDirectiveWithInputs(
  sf: SourceFile,
  directiveIdentifier = 'NgxfwControlDirective',
  expectedInputs: string[] = ['content', 'name'],
) {
  const arr = getDecoratorArrayProp(sf, 'Component', 'hostDirectives');
  if (!arr) {
    return false;
  }

  return arr.elements.some((el) => {
    if (!isObjectLiteralExpression(el)) {
      return false;
    }

    const directiveProp = el.properties.find((p) => {
      if (!isPropertyAssignment(p)) {
        return false;
      }
      const n = p.name;
      const isDirectiveKey =
        (isIdentifier(n) && n.text === 'directive') ||
        (isStringLiteral(n) && n.text === 'directive');
      if (!isDirectiveKey) {
        return false;
      }
      return (
        isIdentifier(p.initializer) &&
        p.initializer.text === directiveIdentifier
      );
    });

    if (!directiveProp) {
      return false;
    }

    const inputsProp = el.properties.find((p) => {
      if (!isPropertyAssignment(p)) {
        return false;
      }
      const n = p.name;
      const isInputsKey =
        (isIdentifier(n) && n.text === 'inputs') ||
        (isStringLiteral(n) && n.text === 'inputs');
      if (!isInputsKey) {
        return false;
      }
      const init = p.initializer;
      if (!isArrayLiteralExpression(init)) {
        return false;
      }
      const values = init.elements.filter(isStringLiteral).map((s) => s.text);
      return expectedInputs.every((i) => values.includes(i));
    });

    return !!inputsProp;
  });
}

export function hasNamedImport(
  sf: SourceFile,
  moduleName: string,
  imported: string,
) {
  let found = false;
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

export function isCallee(expr: Expression, callee: string) {
  if (isIdentifier(expr)) {
    return expr.text === callee;
  }
  if (isPropertyAccessExpression(expr)) {
    return expr.name.text === callee;
  }
  return false;
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
    if (found) {
      return;
    }

    if (!isImportDeclaration(node)) {
      node.forEachChild(visit);
      return;
    }

    const ms = node.moduleSpecifier;
    if (!isStringLiteral(ms)) {
      node.forEachChild(visit);
      return;
    }

    const spec = normalize(ms.text);
    if (spec !== expected) {
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

        if (exported === symbolName) {
          return true;
        }

        return local === symbolName;
      });

      if (hit) {
        found = true;
        return;
      }
    }

    if (isNamespaceImport(nb)) {
      if (nb.name.text === symbolName) {
        found = true;
        return;
      }
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function classDeclarationExists(sf: SourceFile, className: string) {
  let found = false;

  const visit = (node: Node): void => {
    if (found) {
      return;
    }

    if (isClassDeclaration(node) && node.name) {
      found = node.name.text === className;
      return;
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function componentSelectorEquals(sf: SourceFile, expected: string) {
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

export function interfaceHasTypeLiteral(
  sf: SourceFile,
  interfaceName: string,
  typeLiteral: string,
) {
  let ok = false;

  const visit = (node: Node): void => {
    if (ok) {
      return;
    }

    if (isInterfaceDeclaration(node)) {
      if (node.name.text !== interfaceName) {
        node.forEachChild(visit);
        return;
      }

      const typeMember = node.members.find((m) => {
        if (!isPropertySignature(m)) {
          return false;
        }
        const n = m.name;
        return isIdentifier(n) && n.text === 'type';
      });

      if (!typeMember || !isPropertySignature(typeMember)) {
        return;
      }

      const t = typeMember.type;
      if (!t || !isLiteralTypeNode(t)) {
        return;
      }

      const lit = t.literal as StringLiteral | undefined;
      if (!lit) {
        return;
      }

      ok = lit.text === typeLiteral;
      return;
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return ok;
}
