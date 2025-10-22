import { SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  ArrayLiteralExpression,
  CallExpression,
  createPrinter,
  createSourceFile,
  EmitHint,
  factory,
  isCallExpression,
  isIdentifier,
  isNewExpression,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isVariableDeclaration,
  isVariableStatement,
  Node,
  ObjectLiteralExpression,
  PropertyAssignment,
  ScriptTarget,
  SourceFile,
  SyntaxKind,
} from 'typescript';
import { ReplaceChange } from '@schematics/angular/utility/change';
import { NGX_FW_COMPONENT_REGISTRATIONS } from '../ng-add/constants';

export function loadSourceFile(tree: Tree, path: string) {
  const buffer = tree.read(path);
  if (!buffer) {
    return;
  }

  const content = buffer.toString('utf-8');
  return createSourceFile(path, content, ScriptTarget.Latest, true);
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
