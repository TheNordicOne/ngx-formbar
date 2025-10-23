import { SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  ArrayLiteralExpression,
  CallExpression,
  createPrinter,
  createSourceFile,
  EmitHint,
  Expression,
  factory,
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
  isVariableDeclaration,
  isVariableStatement,
  Node,
  ObjectLiteralElementLike,
  ObjectLiteralExpression,
  PropertyAssignment,
  ScriptTarget,
  SourceFile,
  StringLiteral,
  SyntaxKind,
} from 'typescript';
import { ReplaceChange } from '@schematics/angular/utility/change';
import { NGX_FW_COMPONENT_REGISTRATIONS } from '../../shared/constants';
import { normalize, Path } from '@angular-devkit/core';
import { buildRelativePath } from '@schematics/angular/utility/find-module';

export function loadSourceFile(tree: Tree, path: string) {
  const buffer = tree.read(path);
  if (!buffer) {
    return;
  }

  const content = buffer.toString('utf-8');
  return createSourceFile(path, content, ScriptTarget.Latest, true);
}

export function parseTS(code: string) {
  return createSourceFile('temp.ts', code, ScriptTarget.Latest, true);
}

export function findComponentRegistrationsNode(
  sourceFile: SourceFile,
): Node | null {
  let result: Node | null = null;

  function visit(node: Node) {
    if (result) {
      return;
    }

    result =
      findMapNodeInTokenRegistration(node) ??
      findMapNodeInProvideFormwork(node);
    if (result) {
      return;
    }

    node.forEachChild(visit);
  }

  sourceFile.forEachChild(visit);
  return result;
}

function findMapNodeInTokenRegistration(node: Node): Node | null {
  if (!isMapConstructorExpression(node)) {
    return null;
  }

  const parent = node.parent;
  if (!isUseValuePropertyAssignment(parent)) {
    return null;
  }

  const grandParent = parent.parent;
  if (!isObjectLiteralExpression(grandParent)) {
    return null;
  }

  const hasComponentRegistrationsToken = grandParent.properties.some((prop) =>
    isProvidePropertyWithToken(prop, NGX_FW_COMPONENT_REGISTRATIONS),
  );

  return hasComponentRegistrationsToken ? node : null;
}

function findMapNodeInProvideFormwork(node: Node): Node | null {
  if (!isProvideFormworkCall(node)) {
    return null;
  }

  const callExpr = node as CallExpression;

  if (callExpr.arguments.length === 0) {
    return null;
  }

  const arg = callExpr.arguments[0];
  if (!isObjectLiteralExpression(arg)) {
    return null;
  }

  const componentRegProp = arg.properties.find((prop) =>
    isPropertyWithName(prop, 'componentRegistrations'),
  );

  if (
    !componentRegProp ||
    !isPropertyAssignment(componentRegProp) ||
    !isObjectLiteralExpression(componentRegProp.initializer)
  ) {
    return null;
  }

  return componentRegProp.initializer;
}

function isMapConstructorExpression(node: Node): boolean {
  return (
    isNewExpression(node) &&
    isIdentifier(node.expression) &&
    node.expression.text === 'Map'
  );
}

function isUseValuePropertyAssignment(node: Node | undefined): boolean {
  return (
    !!node &&
    isPropertyAssignment(node) &&
    isIdentifier(node.name) &&
    node.name.text === 'useValue'
  );
}

function isProvidePropertyWithToken(prop: Node, tokenName: string): boolean {
  return (
    isPropertyAssignment(prop) &&
    isIdentifier(prop.name) &&
    prop.name.text === 'provide' &&
    isIdentifier(prop.initializer) &&
    prop.initializer.text === tokenName
  );
}

function isProvideFormworkCall(node: Node): boolean {
  return (
    isCallExpression(node) &&
    isPropertyAccessExpression(node.expression) &&
    isIdentifier(node.expression.name) &&
    node.expression.name.text === 'provideFormwork'
  );
}

function isPropertyWithName(prop: Node, name: string): boolean {
  return (
    isPropertyAssignment(prop) &&
    isIdentifier(prop.name) &&
    prop.name.text === name
  );
}

export function findMapArrayLiteral(
  mapExpression: Node,
): ArrayLiteralExpression | null {
  if (!isNewExpression(mapExpression)) {
    return null;
  }

  if (!mapExpression.arguments || mapExpression.arguments.length === 0) {
    return null;
  }

  const firstArg = mapExpression.arguments[0];

  if (firstArg.kind !== SyntaxKind.ArrayLiteralExpression) {
    return null;
  }

  return firstArg as ArrayLiteralExpression;
}

export function updateMapEntries(
  tree: Tree,
  sourceFile: SourceFile,
  filePath: string,
  mapArrayLiteral: ArrayLiteralExpression,
  key: string,
  componentClassName: string,
) {
  const printer = createPrinter({});

  const buffer = tree.read(filePath);
  if (!buffer) {
    throw new SchematicsException(`Missing file or unreadable: ${filePath}`);
  }
  const fileContent = buffer.toString('utf-8');

  const newEntry = createNewMapEntry(key, componentClassName);
  const updatedArray = createUpdatedArray(mapArrayLiteral, newEntry);

  return createChangeForArrayUpdate(
    printer,
    sourceFile,
    filePath,
    mapArrayLiteral,
    updatedArray,
    fileContent,
  );
}

function createNewMapEntry(
  key: string,
  componentClassName: string,
): ArrayLiteralExpression {
  return factory.createArrayLiteralExpression([
    factory.createStringLiteral(key),
    factory.createIdentifier(componentClassName),
  ]);
}

function createUpdatedArray(
  original: ArrayLiteralExpression,
  newEntry: ArrayLiteralExpression,
): ArrayLiteralExpression {
  const elements = [...original.elements, newEntry];
  return factory.updateArrayLiteralExpression(original, elements);
}

function createChangeForArrayUpdate(
  printer: ReturnType<typeof createPrinter>,
  sourceFile: SourceFile,
  filePath: string,
  original: ArrayLiteralExpression,
  updated: ArrayLiteralExpression,
  fileContent: string,
): ReplaceChange[] {
  const start = original.getStart();
  const end = original.getEnd();
  const newText = printer.printNode(EmitHint.Unspecified, updated, sourceFile);

  return [
    new ReplaceChange(filePath, start, fileContent.slice(start, end), newText),
  ];
}

export function findComponentRegistrationsObject(
  sourceFile: SourceFile,
): ObjectLiteralExpression | null {
  let result: ObjectLiteralExpression | null = null;

  function visit(node: Node) {
    if (result) {
      return;
    }

    result =
      findStandaloneComponentRegistrations(node) ??
      findFormworkConfigComponentRegistrations(node) ??
      findProvideFormworkComponentRegistrations(node);

    if (result) {
      return;
    }

    node.forEachChild(visit);
  }

  sourceFile.forEachChild(visit);
  return result;
}

function findStandaloneComponentRegistrations(
  node: Node,
): ObjectLiteralExpression | null {
  if (!isVariableStatement(node)) {
    return null;
  }

  for (const declaration of node.declarationList.declarations) {
    if (
      !isVariableDeclaration(declaration) ||
      !isIdentifier(declaration.name) ||
      !declaration.initializer ||
      !isObjectLiteralExpression(declaration.initializer)
    ) {
      continue;
    }

    if (
      declaration.name.text === 'componentRegistrations' ||
      declaration.name.text === 'componentsRegistrations'
    ) {
      return declaration.initializer;
    }
  }

  return null;
}

function findFormworkConfigComponentRegistrations(
  node: Node,
): ObjectLiteralExpression | null {
  if (
    !isVariableStatement(node) ||
    node.declarationList.declarations.length === 0
  ) {
    return null;
  }

  const declaration = node.declarationList.declarations[0];
  if (
    !isVariableDeclaration(declaration) ||
    !isIdentifier(declaration.name) ||
    declaration.name.text !== 'formworkConfig' ||
    !declaration.initializer
  ) {
    return null;
  }

  if (!isCallExpression(declaration.initializer)) {
    return null;
  }

  const callExpr = declaration.initializer;
  if (
    !isIdentifier(callExpr.expression) ||
    callExpr.expression.text !== 'defineFormworkConfig' ||
    callExpr.arguments.length === 0
  ) {
    return null;
  }

  const configArg = callExpr.arguments[0];
  return getComponentRegistrationExpression(configArg);
}

function findProvideFormworkComponentRegistrations(
  node: Node,
): ObjectLiteralExpression | null {
  if (!isVariableStatement(node)) {
    return null;
  }

  const providersArray = findProvidersArray(node);
  if (!providersArray) {
    return null;
  }

  const provideFormworkCall = providersArray.elements.find(
    (el) =>
      isCallExpression(el) &&
      isIdentifier(el.expression) &&
      el.expression.text === 'provideFormwork',
  ) as CallExpression | undefined;

  if (!provideFormworkCall || provideFormworkCall.arguments.length === 0) {
    return null;
  }

  const configArg = provideFormworkCall.arguments[0];
  return getComponentRegistrationExpression(configArg);
}

function findProvidersArray(node: Node): ArrayLiteralExpression | null {
  if (!isVariableStatement(node)) {
    return null;
  }

  for (const declaration of node.declarationList.declarations) {
    if (!isVariableDeclaration(declaration) || !declaration.initializer) {
      continue;
    }

    if (!isObjectLiteralExpression(declaration.initializer)) {
      continue;
    }

    const providersProperty = declaration.initializer.properties.find(
      (prop) =>
        isPropertyAssignment(prop) &&
        isIdentifier(prop.name) &&
        prop.name.text === 'providers',
    ) as PropertyAssignment | undefined;

    if (!providersProperty || !isPropertyAssignment(providersProperty)) {
      continue;
    }

    return providersProperty.initializer as ArrayLiteralExpression;
  }

  return null;
}

export function addComponentRegistration(
  tree: Tree,
  sourceFile: SourceFile,
  filePath: string,
  registrationsObject: ObjectLiteralExpression,
  key: string,
  componentClassName: string,
): ReplaceChange[] {
  const printer = createPrinter({});

  const buffer = tree.read(filePath);
  if (!buffer) {
    throw new SchematicsException(`Missing file or unreadable: ${filePath}`);
  }
  const fileContent = buffer.toString('utf-8');

  const updatedObject = createUpdatedRegistrationsObject(
    registrationsObject,
    key,
    componentClassName,
  );

  return createChangeForObjectUpdate(
    printer,
    sourceFile,
    filePath,
    registrationsObject,
    updatedObject,
    fileContent,
  );
}

function createUpdatedRegistrationsObject(
  registrationsObject: ObjectLiteralExpression,
  key: string,
  componentClassName: string,
): ObjectLiteralExpression {
  const existingProperties = [...registrationsObject.properties];

  const newProperty = factory.createPropertyAssignment(
    factory.createStringLiteral(key),
    factory.createIdentifier(componentClassName),
  );

  return factory.updateObjectLiteralExpression(registrationsObject, [
    ...existingProperties,
    newProperty,
  ]);
}

function createChangeForObjectUpdate(
  printer: ReturnType<typeof createPrinter>,
  sourceFile: SourceFile,
  filePath: string,
  original: ObjectLiteralExpression,
  updated: ObjectLiteralExpression,
  fileContent: string,
): ReplaceChange[] {
  const start = original.getStart();
  const end = original.getEnd();
  const newText = printer.printNode(EmitHint.Unspecified, updated, sourceFile);

  return [
    new ReplaceChange(filePath, start, fileContent.slice(start, end), newText),
  ];
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

export function getProvideFormworkArg(
  sf: SourceFile,
): ObjectLiteralExpression | undefined {
  let result: ObjectLiteralExpression | undefined;

  const visit = (node: Node): void => {
    if (result) {
      return;
    }

    if (
      isCallExpression(node) &&
      isCallee(node.expression, 'provideFormwork')
    ) {
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

export function defineFormworkConfigComponentRegistrationsHasIdentifier(
  sf: SourceFile,
  key: string,
  identifierName: string,
) {
  let found = false;

  const visit = (node: Node): void => {
    if (found) return;

    if (
      isCallExpression(node) &&
      isCallee(node.expression, 'defineFormworkConfig')
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
) {
  let found = false;

  const visit = (node: Node): void => {
    if (found) return;

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
) {
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
) {
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

function getComponentRegistrationExpression(configArg: Expression) {
  if (!isObjectLiteralExpression(configArg)) {
    return null;
  }

  const componentRegProp = configArg.properties.find(
    (prop) =>
      isPropertyAssignment(prop) &&
      isIdentifier(prop.name) &&
      prop.name.text === 'componentRegistrations',
  );

  if (
    !componentRegProp ||
    !isPropertyAssignment(componentRegProp) ||
    !isObjectLiteralExpression(componentRegProp.initializer)
  ) {
    return null;
  }

  return componentRegProp.initializer;
}

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
