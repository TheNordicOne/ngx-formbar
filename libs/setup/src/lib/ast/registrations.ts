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
import {
  findProvidersProperty,
  nameOfProperty,
  unwrapToObjectLiteral,
} from '../ast';
import {
  createTreeCompilerHost,
  pathUnderRoot,
  readCompilerOptions,
  treePath,
} from '../tsconfig';
import { findWorkspaceRoot } from '../workspace-root';
import { declarationOf } from './exports';
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
  function visit(node: Node): Node | undefined {
    return findMapNodeInTokenRegistration(node) ?? node.forEachChild(visit);
  }

  return sourceFile.forEachChild(visit) ?? null;
}

export function findMapArrayLiteral(
  mapExpression: Node,
): ArrayLiteralExpression | null {
  const firstArg = isNewExpression(mapExpression)
    ? mapExpression.arguments?.at(0)
    : undefined;

  return firstArg && isArrayLiteralExpression(firstArg) ? firstArg : null;
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
  function visit(node: Node): ObjectLiteralExpression | undefined {
    return (
      findStandaloneComponentRegistrations(node) ??
      findFormbarConfigComponentRegistrations(node) ??
      findProvideFormbarComponentRegistrations(node) ??
      node.forEachChild(visit)
    );
  }

  return sourceFile.forEachChild(visit) ?? null;
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
  const entries = findMapArrayLiteral(node);

  return !!entries && arrayLiteralHasKey(entries, key);
}

export function registrationNodeUsesComponent(
  node: Node,
  component: RegisteredComponentQuery,
): boolean {
  const entries = findMapArrayLiteral(node);

  return !!entries && arrayLiteralUsesComponent(entries, component);
}

export function componentRegistrationsObjectHasKey(
  node: ObjectLiteralExpression,
  key: string,
): boolean {
  return node.properties.some((property) => isPropertyWithName(property, key));
}

export function componentRegistrationsObjectUsesComponent(
  node: ObjectLiteralExpression,
  component: RegisteredComponentQuery,
): boolean {
  return node.properties.some(
    (property) =>
      isPropertyAssignment(property) &&
      registers(property.initializer, component),
  );
}

function findMapNodeInTokenRegistration(node: Node) {
  const property = node.parent;
  const owner = isPropertyWithName(property, 'useValue')
    ? property.parent
    : undefined;

  return isMapConstructorExpression(node) &&
    owner &&
    isObjectLiteralExpression(owner) &&
    owner.properties.some((prop) =>
      isProvidePropertyWithToken(prop, NGX_FW_COMPONENT_REGISTRATIONS),
    )
    ? node
    : null;
}

function isMapConstructorExpression(node: Node) {
  return (
    isNewExpression(node) &&
    isIdentifier(node.expression) &&
    node.expression.text === 'Map'
  );
}

function isProvidePropertyWithToken(prop: Node, tokenName: string) {
  return (
    isPropertyWithName(prop, 'provide') &&
    isPropertyAssignment(prop) &&
    isIdentifier(prop.initializer) &&
    prop.initializer.text === tokenName
  );
}

function isPropertyWithName(prop: Node, name: string) {
  return isPropertyAssignment(prop) && nameOfProperty(prop.name) === name;
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
  const declared =
    registered &&
    declarationOfClass(value.getSourceFile(), registered, component);

  return (
    declared?.className === component.className &&
    declared.filePath === component.filePath
  );
}

/** Without a `specifier`, the class is declared in the registrations file. */
function declarationOfClass(
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
    ? { filePath: fileName, className }
    : declarationOf(tree, className, resolve, specifier, fileName);
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
    then &&
    isPropertyAccessExpression(then.expression) &&
    then.expression.name.text === 'then'
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
    load &&
    isCallExpression(load) &&
    load.expression.kind === SyntaxKind.ImportKeyword
      ? load.arguments.at(0)
      : undefined;

  return specifier && isStringLiteralLike(specifier)
    ? specifier.text
    : undefined;
}

function findStandaloneComponentRegistrations(node: Node) {
  const declaration = isVariableStatement(node)
    ? node.declarationList.declarations.find(
        ({ name, initializer }) =>
          isIdentifier(name) &&
          ['componentRegistrations', 'componentsRegistrations'].includes(
            name.text,
          ) &&
          !!initializer &&
          isObjectLiteralExpression(initializer),
      )
    : undefined;

  return declaration?.initializer &&
    isObjectLiteralExpression(declaration.initializer)
    ? declaration.initializer
    : null;
}

function findFormbarConfigComponentRegistrations(node: Node) {
  const initializer = isVariableStatement(node)
    ? node.declarationList.declarations.find(
        ({ name }) => isIdentifier(name) && name.text === 'formbarConfig',
      )?.initializer
    : undefined;
  const configArg =
    initializer &&
    isCallExpression(initializer) &&
    isIdentifier(initializer.expression) &&
    initializer.expression.text === 'defineFormbarConfig'
      ? initializer.arguments.at(0)
      : undefined;

  return configArg ? getComponentRegistrationExpression(configArg) : null;
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
  const property = isObjectLiteralExpression(configArg)
    ? configArg.properties.find((prop) =>
        isPropertyWithName(prop, 'componentRegistrations'),
      )
    : undefined;

  return property &&
    isPropertyAssignment(property) &&
    isObjectLiteralExpression(property.initializer)
    ? property.initializer
    : null;
}

function arrayLiteralHasKey(arr: ArrayLiteralExpression, key: string) {
  return arr.elements.some(
    (el) =>
      isArrayLiteralExpression(el) &&
      el.elements.length === 2 &&
      isStringLiteral(el.elements[0]) &&
      el.elements[0].text === key,
  );
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
