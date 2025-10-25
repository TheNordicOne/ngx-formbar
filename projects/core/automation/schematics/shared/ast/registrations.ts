import { SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  ArrayLiteralExpression,
  CallExpression,
  createPrinter,
  EmitHint,
  Expression,
  factory,
  isArrayLiteralExpression,
  isCallExpression,
  isIdentifier,
  isNewExpression,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isStringLiteral,
  isVariableDeclaration,
  isVariableStatement,
  Node,
  ObjectLiteralElementLike,
  ObjectLiteralExpression,
  PropertyAssignment,
  SourceFile,
  SyntaxKind,
  VariableDeclaration,
} from 'typescript';
import { ReplaceChange } from '@schematics/angular/utility/change';
import { NGX_FW_COMPONENT_REGISTRATIONS } from '../../../shared/constants';
import { isCallee } from './decorators';

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

export function findMapArrayLiteral(mapExpression: Node) {
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

export function addComponentRegistration(
  tree: Tree,
  sourceFile: SourceFile,
  filePath: string,
  registrationsObject: ObjectLiteralExpression,
  key: string,
  componentClassName: string,
) {
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

export function getProvideFormworkArg(sf: SourceFile) {
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

export function matchesIdentifierName(
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

export function registrationNodeHasKey(node: Node, key: string) {
  if (isNewExpression(node)) {
    const arr = findMapArrayLiteral(node);
    if (!arr) {
      return false;
    }
    return arrayLiteralHasKey(arr, key);
  }

  if (isObjectLiteralExpression(node)) {
    return objectLiteralHasKey(node, key);
  }

  return false;
}

export function registrationNodeUsesIdentifier(
  node: Node,
  identifierName: string,
) {
  if (isNewExpression(node)) {
    const arr = findMapArrayLiteral(node);
    if (!arr) {
      return false;
    }
    return arrayLiteralUsesIdentifier(arr, identifierName);
  }

  if (isObjectLiteralExpression(node)) {
    return objectLiteralUsesIdentifier(node, identifierName);
  }

  return false;
}

export function registrationsObjectHasKey(
  obj: ObjectLiteralExpression,
  key: string,
) {
  for (const p of obj.properties) {
    if (!isPropertyAssignment(p)) {
      continue;
    }
    const n = p.name;
    const matchesKey =
      (isIdentifier(n) && n.text === key) ||
      (isStringLiteral(n) && n.text === key);

    if (matchesKey) {
      return true;
    }
  }

  return false;
}

export function registrationsObjectUsesIdentifier(
  obj: ObjectLiteralExpression,
  identifierName: string,
) {
  for (const p of obj.properties) {
    if (!isPropertyAssignment(p)) {
      continue;
    }
    if (isIdentifier(p.initializer) && p.initializer.text === identifierName) {
      return true;
    }
  }

  return false;
}

export function componentRegistrationsObjectHasKey(
  node: Node | null,
  key: string,
) {
  if (!node) {
    return false;
  }

  if (!isObjectLiteralExpression(node)) {
    return false;
  }

  return registrationsObjectHasKey(node, key);
}

export function componentRegistrationsObjectUsesIdentifier(
  node: Node | null,
  identifierName: string,
) {
  if (!node) {
    return false;
  }

  if (!isObjectLiteralExpression(node)) {
    return false;
  }

  return registrationsObjectUsesIdentifier(node, identifierName);
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

export function getMapArguments(decl: VariableDeclaration) {
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

function findMapNodeInTokenRegistration(node: Node) {
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

function findMapNodeInProvideFormwork(node: Node) {
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

function isMapConstructorExpression(node: Node) {
  return (
    isNewExpression(node) &&
    isIdentifier(node.expression) &&
    node.expression.text === 'Map'
  );
}

function isUseValuePropertyAssignment(node: Node | undefined) {
  return (
    !!node &&
    isPropertyAssignment(node) &&
    isIdentifier(node.name) &&
    node.name.text === 'useValue'
  );
}

function isProvidePropertyWithToken(prop: Node, tokenName: string) {
  return (
    isPropertyAssignment(prop) &&
    isIdentifier(prop.name) &&
    prop.name.text === 'provide' &&
    isIdentifier(prop.initializer) &&
    prop.initializer.text === tokenName
  );
}

function isProvideFormworkCall(node: Node) {
  return (
    isCallExpression(node) &&
    isPropertyAccessExpression(node.expression) &&
    isIdentifier(node.expression.name) &&
    node.expression.name.text === 'provideFormwork'
  );
}

function isPropertyWithName(prop: Node, name: string) {
  return (
    isPropertyAssignment(prop) &&
    isIdentifier(prop.name) &&
    prop.name.text === name
  );
}

function createNewMapEntry(key: string, componentClassName: string) {
  return factory.createArrayLiteralExpression([
    factory.createStringLiteral(key),
    factory.createIdentifier(componentClassName),
  ]);
}

function createUpdatedArray(
  original: ArrayLiteralExpression,
  newEntry: ArrayLiteralExpression,
) {
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
) {
  const start = original.getStart();
  const end = original.getEnd();
  const newText = printer.printNode(EmitHint.Unspecified, updated, sourceFile);

  return [
    new ReplaceChange(filePath, start, fileContent.slice(start, end), newText),
  ];
}

function findStandaloneComponentRegistrations(node: Node) {
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

function findFormworkConfigComponentRegistrations(node: Node) {
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

function findProvideFormworkComponentRegistrations(node: Node) {
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

function findProvidersArray(node: Node) {
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

function createUpdatedRegistrationsObject(
  registrationsObject: ObjectLiteralExpression,
  key: string,
  componentClassName: string,
) {
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
) {
  const start = original.getStart();
  const end = original.getEnd();
  const newText = printer.printNode(EmitHint.Unspecified, updated, sourceFile);

  return [
    new ReplaceChange(filePath, start, fileContent.slice(start, end), newText),
  ];
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

function arrayLiteralHasKey(arr: ArrayLiteralExpression, key: string) {
  for (const el of arr.elements) {
    if (!isArrayLiteralExpression(el) || el.elements.length !== 2) {
      continue;
    }
    const [k] = el.elements;
    if (isStringLiteral(k) && k.text === key) {
      return true;
    }
  }
  return false;
}

function arrayLiteralUsesIdentifier(
  arr: ArrayLiteralExpression,
  identifierName: string,
) {
  for (const el of arr.elements) {
    if (!isArrayLiteralExpression(el) || el.elements.length !== 2) {
      continue;
    }
    const [, v] = el.elements;
    if (isIdentifier(v) && v.text === identifierName) {
      return true;
    }
  }
  return false;
}

function objectLiteralHasKey(obj: ObjectLiteralExpression, key: string) {
  for (const p of obj.properties) {
    if (!isPropertyAssignment(p)) {
      continue;
    }
    const n = p.name;
    if (isIdentifier(n) && n.text === key) {
      return true;
    }
    if (isStringLiteral(n) && n.text === key) {
      return true;
    }
  }
  return false;
}

function objectLiteralUsesIdentifier(
  obj: ObjectLiteralExpression,
  identifierName: string,
) {
  for (const p of obj.properties) {
    if (!isPropertyAssignment(p)) {
      continue;
    }
    if (isIdentifier(p.initializer) && p.initializer.text === identifierName) {
      return true;
    }
  }
  return false;
}
