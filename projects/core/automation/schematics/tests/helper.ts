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
  isNewExpression,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isPropertySignature,
  isStringLiteral,
  isVariableStatement,
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

export function getProvideFormworkArg(
  sf: SourceFile,
): ObjectLiteralExpression | undefined {
  let result: ObjectLiteralExpression | undefined;

  const visit = (node: Node): void => {
    if (result) {
      return;
    }

    if (isPropertyAssignment(node)) {
      const n = node.name;
      const isProviders =
        (isIdentifier(n) && n.text === 'providers') ||
        (isStringLiteral(n) && n.text === 'providers');
      if (!isProviders) {
        node.forEachChild(visit);
        return;
      }

      const init = node.initializer;
      if (!isArrayLiteralExpression(init)) {
        node.forEachChild(visit);
        return;
      }

      const call = init.elements.find((el) => {
        if (!isCallExpression(el)) {
          return false;
        }
        return isCallee(
          el.expression as unknown as Expression,
          'provideFormwork',
        );
      });

      if (!call || !isCallExpression(call)) {
        node.forEachChild(visit);
        return;
      }

      const [firstArg] = call.arguments;
      if (call.arguments.length === 0 || !isObjectLiteralExpression(firstArg)) {
        node.forEachChild(visit);
        return;
      }

      result = firstArg as unknown as ObjectLiteralExpression;
      return;
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return result;
}

export function provideFormworkComponentRegistrationsHasIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
) {
  const arg = getProvideFormworkArg(sf);
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
    return isIdentifier(p.initializer) && p.initializer.text === identifierName;
  });

  return !!entry;
}

export function defineFormworkConfigComponentRegistrationsHasIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
) {
  let found = false;

  const visit = (node: Node): void => {
    if (found) {
      return;
    }

    if (
      isCallExpression(node) &&
      isCallee(node.expression, 'defineFormworkConfig')
    ) {
      const [firstArg] = node.arguments;
      if (node.arguments.length === 0 || !isObjectLiteralExpression(firstArg)) {
        node.forEachChild(visit);
        return;
      }

      const regProp = firstArg.properties.find((p) => {
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
        node.forEachChild(visit);
        return;
      }

      const nested = regProp.initializer;
      if (!isObjectLiteralExpression(nested)) {
        node.forEachChild(visit);
        return;
      }

      found = nested.properties.some((p) => {
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
          isIdentifier(p.initializer) && p.initializer.text === identifierName
        );
      });
      return;
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
) {
  let found = false;

  const visit = (node: Node): void => {
    if (found) {
      return;
    }

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
            isIdentifier(p.initializer) && p.initializer.text === identifierName
          );
        });
        return;
      }
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
) {
  let found = false;

  const visit = (node: Node): void => {
    if (found) {
      return;
    }

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

        // Find the useValue property
        const useValueProp = init.properties.find((p) => {
          if (!isPropertyAssignment(p)) {
            return false;
          }
          const n = p.name;
          return (
            (isIdentifier(n) && n.text === 'useValue') ||
            (isStringLiteral(n) && n.text === 'useValue')
          );
        });

        if (!useValueProp || !isPropertyAssignment(useValueProp)) {
          continue;
        }

        // Check if useValue is a new Map expression
        const mapExpr = useValueProp.initializer;
        if (
          !isCallExpression(mapExpr) ||
          !isNewExpression(mapExpr.expression) ||
          !isIdentifier(mapExpr.expression.expression) ||
          mapExpr.expression.expression.text !== 'Map'
        ) {
          continue;
        }

        // Check if the Map has arguments
        if (mapExpr.arguments.length === 0) {
          continue;
        }

        // Get the array literal that initializes the Map
        const mapArg = mapExpr.arguments[0];
        if (!isArrayLiteralExpression(mapArg)) {
          continue;
        }

        // Check each entry in the Map
        found = mapArg.elements.some((el) => {
          if (!isArrayLiteralExpression(el)) {
            return false;
          }

          if (el.elements.length !== 2) {
            return false;
          }

          const keyElement = el.elements[0];
          const valueElement = el.elements[1];

          // Check if the key matches
          const keyMatches =
            isStringLiteral(keyElement) && keyElement.text === key;

          // Check if the value is the identifier we're looking for
          const valueMatches =
            isIdentifier(valueElement) && valueElement.text === identifierName;

          return keyMatches && valueMatches;
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
) {
  let found = false;

  const visit = (node: Node): void => {
    if (found) {
      return;
    }

    if (isVariableStatement(node)) {
      const decls = node.declarationList.declarations;
      for (const decl of decls) {
        if (!isIdentifier(decl.name) || decl.name.text !== 'appConfig') {
          continue;
        }

        const init = decl.initializer;
        if (!init || !isObjectLiteralExpression(init)) {
          continue;
        }

        // Find the providers property
        const providersProp = init.properties.find((p) => {
          if (!isPropertyAssignment(p)) {
            return false;
          }
          const n = p.name;
          return (
            (isIdentifier(n) && n.text === 'providers') ||
            (isStringLiteral(n) && n.text === 'providers')
          );
        });

        if (!providersProp || !isPropertyAssignment(providersProp)) {
          continue;
        }

        // Check if providers is an array
        const providersArray = providersProp.initializer;
        if (!isArrayLiteralExpression(providersArray)) {
          continue;
        }

        // Find the component registrations provider object
        const registrationsProvider = providersArray.elements.find((el) => {
          if (!isObjectLiteralExpression(el)) {
            return false;
          }

          // Check if this object has a provide property with NGX_FW_COMPONENT_REGISTRATIONS
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

            return (
              isIdentifier(p.initializer) &&
              p.initializer.text === 'NGX_FW_COMPONENT_REGISTRATIONS'
            );
          });

          return !!provideProp;
        });

        if (
          !registrationsProvider ||
          !isObjectLiteralExpression(registrationsProvider)
        ) {
          continue;
        }

        // Find the useValue property in the provider object
        const useValueProp = registrationsProvider.properties.find((p) => {
          if (!isPropertyAssignment(p)) {
            return false;
          }
          const n = p.name;
          return (
            (isIdentifier(n) && n.text === 'useValue') ||
            (isStringLiteral(n) && n.text === 'useValue')
          );
        });

        if (!useValueProp || !isPropertyAssignment(useValueProp)) {
          continue;
        }

        // Check if useValue is a new Map expression
        const mapExpr = useValueProp.initializer;
        if (
          !isCallExpression(mapExpr) ||
          !isNewExpression(mapExpr.expression) ||
          !isIdentifier(mapExpr.expression.expression) ||
          mapExpr.expression.expression.text !== 'Map'
        ) {
          continue;
        }

        // Check if the Map has arguments
        if (mapExpr.arguments.length === 0) {
          continue;
        }

        // Get the array literal that initializes the Map
        const mapArg = mapExpr.arguments[0];
        if (!isArrayLiteralExpression(mapArg)) {
          continue;
        }

        // Check each entry in the Map
        found = mapArg.elements.some((el) => {
          if (!isArrayLiteralExpression(el)) {
            return false;
          }

          if (el.elements.length !== 2) {
            return false;
          }

          const keyElement = el.elements[0];
          const valueElement = el.elements[1];

          // Check if the key matches
          const keyMatches =
            isStringLiteral(keyElement) && keyElement.text === key;

          // Check if the value is the identifier we're looking for
          const valueMatches =
            isIdentifier(valueElement) && valueElement.text === identifierName;

          return keyMatches && valueMatches;
        });

        return;
      }
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}
