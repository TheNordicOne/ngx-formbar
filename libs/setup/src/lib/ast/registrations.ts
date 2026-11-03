import { SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  ArrayLiteralExpression,
  CallExpression,
  createPrinter,
  EmitHint,
  Expression,
  factory,
  Identifier,
  ImportClause,
  isArrowFunction,
  isArrayLiteralExpression,
  isCallExpression,
  isIdentifier,
  isImportDeclaration,
  isNamedImports,
  isNewExpression,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isStringLiteral,
  isStringLiteralLike,
  isVariableDeclaration,
  isVariableStatement,
  Node,
  ObjectLiteralExpression,
  PropertyAssignment,
  resolveModuleName,
  SourceFile,
  SyntaxKind,
  VariableDeclaration,
} from 'typescript';
import { ReplaceChange } from '@schematics/angular/utility/change';
import { NGX_FW_COMPONENT_REGISTRATIONS } from '../constants';
import { findProvidersProperty, unwrapToObjectLiteral } from '../ast';
import { createTreeCompilerHost, readCompilerOptions } from '../tsconfig';
import { fileDeclaring } from './exports';

const registrationHelpers = ['staticComponent', 'loadComponent'];

/** The component a registrations file is searched for. */
export interface RegisteredComponentQuery {
  tree: Tree;
  tsConfigPath: string;
  className: string;
  filePath: string;
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
      findMapNodeInTokenRegistration(node) ?? findMapNodeInProvideFormbar(node);
    if (result) {
      return;
    }

    node.forEachChild(visit);
  }

  sourceFile.forEachChild(visit);
  return result;
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
  importPath: string,
): ReplaceChange[] {
  const printer = createPrinter({});

  const buffer = tree.read(filePath);
  if (!buffer) {
    throw new SchematicsException(`Missing file or unreadable: ${filePath}`);
  }
  const fileContent = buffer.toString('utf-8');

  const newEntry = createNewMapEntry(key, componentClassName, importPath);
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
      findFormbarConfigComponentRegistrations(node) ??
      findProvideFormbarComponentRegistrations(node);

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
  importPath: string,
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
    importPath,
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

export function registrationNodeHasKey(node: Node, key: string): boolean {
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

export function registrationNodeUsesComponent(
  node: Node,
  component: RegisteredComponentQuery,
): boolean {
  if (isNewExpression(node)) {
    const arr = findMapArrayLiteral(node);
    if (!arr) {
      return false;
    }
    return arrayLiteralUsesComponent(arr, component);
  }

  if (isObjectLiteralExpression(node)) {
    return objectLiteralUsesComponent(node, component);
  }

  return false;
}

function registrationsObjectHasKey(obj: ObjectLiteralExpression, key: string) {
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

export function componentRegistrationsObjectHasKey(
  node: Node | null,
  key: string,
): boolean {
  if (!node) {
    return false;
  }

  if (!isObjectLiteralExpression(node)) {
    return false;
  }

  return registrationsObjectHasKey(node, key);
}

export function componentRegistrationsObjectUsesComponent(
  node: Node | null,
  component: RegisteredComponentQuery,
): boolean {
  if (!node) {
    return false;
  }

  if (!isObjectLiteralExpression(node)) {
    return false;
  }

  return objectLiteralUsesComponent(node, component);
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

function findMapNodeInProvideFormbar(node: Node) {
  if (!isProvideFormbarCall(node)) {
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

function isProvideFormbarCall(node: Node) {
  return (
    isCallExpression(node) &&
    isPropertyAccessExpression(node.expression) &&
    isIdentifier(node.expression.name) &&
    node.expression.name.text === 'provideFormbar'
  );
}

function isPropertyWithName(prop: Node, name: string) {
  return (
    isPropertyAssignment(prop) &&
    isIdentifier(prop.name) &&
    prop.name.text === name
  );
}

function createLazyImportExpression(
  importPath: string,
  componentClassName: string,
) {
  const dynamicImport = factory.createCallExpression(
    factory.createToken(SyntaxKind.ImportKeyword) as unknown as Expression,
    undefined,
    [factory.createStringLiteral(importPath)],
  );

  const thenCallback = factory.createArrowFunction(
    undefined,
    undefined,
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createIdentifier('m'),
      ),
    ],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    factory.createPropertyAccessExpression(
      factory.createIdentifier('m'),
      factory.createIdentifier(componentClassName),
    ),
  );

  const thenCall = factory.createCallExpression(
    factory.createPropertyAccessExpression(
      dynamicImport,
      factory.createIdentifier('then'),
    ),
    undefined,
    [thenCallback],
  );

  const arrowFn = factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    factory.createToken(SyntaxKind.EqualsGreaterThanToken),
    thenCall,
  );

  return factory.createCallExpression(
    factory.createIdentifier('loadComponent'),
    undefined,
    [arrowFn],
  );
}

/** Whether a registration value, in any form it can take, holds the component. */
function registers(value: Node, component: RegisteredComponentQuery) {
  const target = registrationTarget(value);
  const registered =
    target && isIdentifier(target) ? importedClass(target) : lazyClass(target);

  return (
    registered?.className === component.className &&
    declaringFile(value.getSourceFile(), registered, component) ===
      component.filePath
  );
}

/** Without a `specifier`, the class is declared in the registrations file. */
function declaringFile(
  { fileName }: SourceFile,
  { className, specifier }: RegisteredClass,
  { tree, tsConfigPath }: RegisteredComponentQuery,
) {
  const options = readCompilerOptions(tree, tsConfigPath);
  const host = createTreeCompilerHost(tree);

  return specifier === undefined
    ? fileName
    : fileDeclaring(
        tree,
        className,
        (moduleSpecifier, fromFile) =>
          resolveModuleName(moduleSpecifier, fromFile, options, host)
            .resolvedModule?.resolvedFileName,
        specifier,
        fileName,
      );
}

function registrationTarget(value: Node) {
  if (isCallExpression(value)) {
    return isIdentifier(value.expression) &&
      registrationHelpers.includes(value.expression.text)
      ? value.arguments.at(0)
      : undefined;
  }

  return isObjectLiteralExpression(value)
    ? value.properties.find(
        (property): property is PropertyAssignment =>
          isPropertyWithName(property, 'component') ||
          isPropertyWithName(property, 'loadComponent'),
      )?.initializer
    : value;
}

interface RegisteredClass {
  className: string;
  specifier?: string;
}

function importedClass(local: Identifier) {
  const imported = local
    .getSourceFile()
    .statements.filter(isImportDeclaration)
    .flatMap(({ importClause }) => namedImportsOf(importClause))
    .find(({ name }) => name.text === local.text);
  const moduleSpecifier = imported?.parent.parent.parent.moduleSpecifier;

  return imported && moduleSpecifier && isStringLiteral(moduleSpecifier)
    ? {
        className: (imported.propertyName ?? imported.name).text,
        specifier: moduleSpecifier.text,
      }
    : { className: local.text };
}

function namedImportsOf(importClause: ImportClause | undefined) {
  const bindings = importClause?.namedBindings;

  return bindings && isNamedImports(bindings) ? [...bindings.elements] : [];
}

function lazyClass(target: Node | undefined) {
  const then =
    target && isArrowFunction(target) && isCallExpression(target.body)
      ? target.body
      : undefined;
  const callback = then?.arguments.at(0);
  const picked =
    callback && isArrowFunction(callback) ? callback.body : undefined;
  const specifier = then && dynamicImportSpecifier(then);

  return specifier &&
    picked &&
    isPropertyAccessExpression(picked) &&
    isIdentifier(picked.name)
    ? { className: picked.name.text, specifier }
    : null;
}

function dynamicImportSpecifier({ expression }: CallExpression) {
  const load = isPropertyAccessExpression(expression)
    ? expression.expression
    : undefined;
  const specifier =
    load && isCallExpression(load) ? load.arguments.at(0) : undefined;

  return specifier && isStringLiteralLike(specifier)
    ? specifier.text
    : undefined;
}

function createNewMapEntry(
  key: string,
  componentClassName: string,
  importPath: string,
) {
  return factory.createArrayLiteralExpression([
    factory.createStringLiteral(key),
    createLazyImportExpression(importPath, componentClassName),
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

function findFormbarConfigComponentRegistrations(node: Node) {
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
    declaration.name.text !== 'formbarConfig' ||
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
    callExpr.expression.text !== 'defineFormbarConfig' ||
    callExpr.arguments.length === 0
  ) {
    return null;
  }

  const configArg = callExpr.arguments[0];
  return getComponentRegistrationExpression(configArg);
}

function findProvideFormbarComponentRegistrations(node: Node) {
  if (!isVariableStatement(node)) {
    return null;
  }

  const provideFormbarCall = node.declarationList.declarations
    .flatMap((declaration) => [...providersOf(declaration)])
    .find(
      (el): el is CallExpression =>
        isCallExpression(el) &&
        isIdentifier(el.expression) &&
        el.expression.text === 'provideFormbar',
    );

  return provideFormbarCall?.arguments.length
    ? getComponentRegistrationExpression(provideFormbarCall.arguments[0])
    : null;
}

function providersOf({ initializer }: VariableDeclaration) {
  const owner = initializer && unwrapToObjectLiteral(initializer);
  const providers = owner && findProvidersProperty(owner);

  return providers &&
    isPropertyAssignment(providers) &&
    isArrayLiteralExpression(providers.initializer)
    ? providers.initializer.elements
    : [];
}

function createUpdatedRegistrationsObject(
  registrationsObject: ObjectLiteralExpression,
  key: string,
  componentClassName: string,
  importPath: string,
) {
  const existingProperties = [...registrationsObject.properties];

  const newProperty = factory.createPropertyAssignment(
    factory.createStringLiteral(key),
    createLazyImportExpression(importPath, componentClassName),
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

function arrayLiteralUsesComponent(
  arr: ArrayLiteralExpression,
  component: RegisteredComponentQuery,
) {
  return arr.elements.some(
    (el) =>
      isArrayLiteralExpression(el) &&
      el.elements.length === 2 &&
      registers(el.elements[1], component),
  );
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

function objectLiteralUsesComponent(
  obj: ObjectLiteralExpression,
  component: RegisteredComponentQuery,
) {
  return obj.properties.some(
    (p) => isPropertyAssignment(p) && registers(p.initializer, component),
  );
}
