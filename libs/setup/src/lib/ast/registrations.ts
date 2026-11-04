import { Tree } from '@angular-devkit/schematics';
import {
  ArrayLiteralExpression,
  ArrowFunction,
  CallExpression,
  Expression,
  factory,
  Identifier,
  ImportClause,
  isArrowFunction,
  isArrayLiteralExpression,
  isAwaitExpression,
  isCallExpression,
  isIdentifier,
  isImportDeclaration,
  isNamedImports,
  isNewExpression,
  isObjectBindingPattern,
  isObjectLiteralExpression,
  isParenthesizedExpression,
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
import { Change } from '@schematics/angular/utility/change';
import { NGX_FW_COMPONENT_REGISTRATIONS } from '../constants';
import { findProvidersProperty, unwrapToObjectLiteral } from '../ast';
import {
  createTreeCompilerHost,
  pathUnderRoot,
  readCompilerOptions,
  treePath,
} from '../tsconfig';
import { findWorkspaceRoot } from '../workspace-root';
import { fileDeclaring } from './exports';
import { appendToLiteral } from './insert';

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
  sourceFile: SourceFile,
  filePath: string,
  mapArrayLiteral: ArrayLiteralExpression,
  key: string,
  componentClassName: string,
  importPath: string,
): Change[] {
  return appendToLiteral(sourceFile, filePath, mapArrayLiteral, [
    factory.createArrayLiteralExpression([
      factory.createStringLiteral(key),
      createLazyImportExpression(importPath, componentClassName),
    ]),
  ]);
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
  sourceFile: SourceFile,
  filePath: string,
  registrationsObject: ObjectLiteralExpression,
  key: string,
  componentClassName: string,
  importPath: string,
): Change[] {
  return appendToLiteral(sourceFile, filePath, registrationsObject, [
    factory.createPropertyAssignment(
      factory.createStringLiteral(key),
      createLazyImportExpression(importPath, componentClassName),
    ),
  ]);
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
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const options = readCompilerOptions(tree, tsConfigPath, workspaceRoot);
  const host = createTreeCompilerHost(tree, { workspaceRoot });
  const resolve = (moduleSpecifier: string, fromFile: string) => {
    const resolved = resolveModuleName(
      moduleSpecifier,
      pathUnderRoot(fromFile, workspaceRoot),
      options,
      host,
    ).resolvedModule?.resolvedFileName;

    return resolved && (treePath(resolved, workspaceRoot) ?? undefined);
  };

  return specifier === undefined
    ? fileName
    : fileDeclaring(tree, className, resolve, specifier, fileName);
}

function registrationTarget(value: Node) {
  return isCallExpression(value)
    ? helperArgument(value)
    : isObjectLiteralExpression(value)
      ? value.properties.find(
          (property): property is PropertyAssignment =>
            isPropertyWithName(property, 'component') ||
            isPropertyWithName(property, 'loadComponent'),
        )?.initializer
      : value;
}

function helperArgument({ expression, arguments: args }: CallExpression) {
  return isIdentifier(expression) &&
    registrationHelpers.includes(expression.text)
    ? args.at(0)
    : undefined;
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
  const body = target && isArrowFunction(target) ? target.body : undefined;

  return body ? (thenPickedClass(body) ?? awaitedClass(body)) : null;
}

/** `import('x').then((m) => m.X)` and `import('x').then(({ X }) => X)` */
function thenPickedClass(body: Node) {
  const then = isCallExpression(body) ? body : undefined;
  const load =
    then && isPropertyAccessExpression(then.expression)
      ? then.expression.expression
      : undefined;
  const specifier = dynamicImportSpecifier(load);
  const callback = then?.arguments.at(0);
  const className =
    callback && isArrowFunction(callback) ? pickedName(callback) : undefined;

  return specifier && className ? { className, specifier } : null;
}

function pickedName({ parameters, body }: ArrowFunction) {
  const pattern = parameters.at(0)?.name;
  const element =
    pattern && isObjectBindingPattern(pattern) && isIdentifier(body)
      ? pattern.elements.find(
          ({ name }) => isIdentifier(name) && name.text === body.text,
        )
      : undefined;
  const exported = element?.propertyName ?? element?.name;

  return isPropertyAccessExpression(body)
    ? body.name.text
    : exported && isIdentifier(exported)
      ? exported.text
      : undefined;
}

/** `(await import('x')).X` */
function awaitedClass(body: Node) {
  const access = isPropertyAccessExpression(body) ? body : undefined;
  const awaited =
    access && isParenthesizedExpression(access.expression)
      ? access.expression.expression
      : undefined;
  const load =
    awaited && isAwaitExpression(awaited) ? awaited.expression : undefined;
  const specifier = dynamicImportSpecifier(load);

  return access && specifier
    ? { className: access.name.text, specifier }
    : null;
}

function dynamicImportSpecifier(load: Node | undefined) {
  const specifier =
    load && isCallExpression(load) ? load.arguments.at(0) : undefined;

  return specifier && isStringLiteralLike(specifier)
    ? specifier.text
    : undefined;
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
