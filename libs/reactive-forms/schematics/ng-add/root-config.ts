import { normalize } from '@angular-devkit/core';
import {
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import {
  applyToUpdateRecorder,
  Change,
  InsertChange,
} from '@schematics/angular/utility/change';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import {
  ProjectDefinition,
  WorkspaceDefinition,
} from '@schematics/angular/utility/workspace';
import {
  findProvidersProperty,
  findTsConfigPath,
  findVariableWithObjectLiteral,
  isCallee,
  isInsideProject,
  joinToSourceRoot,
  readCompilerOptions,
  unwrapToObjectLiteral,
} from '@ngx-formbar/setup';
import {
  CallExpression,
  canHaveDecorators,
  ClassDeclaration,
  CompilerHost,
  CompilerOptions,
  createProgram,
  createSourceFile,
  Expression,
  getDecorators,
  isArrayLiteralExpression,
  isCallExpression,
  isClassDeclaration,
  isExportDeclaration,
  isIdentifier,
  isImportDeclaration,
  isNamedImports,
  isNamespaceImport,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isSourceFile,
  isSpreadAssignment,
  isStringLiteralLike,
  isVariableDeclaration,
  Node,
  ObjectLiteralExpression,
  Program,
  resolveModuleName,
  SourceFile,
  SymbolFlags,
  SyntaxKind,
  TypeChecker,
} from 'typescript';
import { DEFAULT_APP_CONFIG_FILE } from '../shared/constants';

/**
 * Where the application's root providers live. `variable` is a config object
 * declared in a variable, which every registration style can be scaffolded
 * into. Its name is unknown at the default location, where no bootstrap call
 * refers to it. `bootstrap` is the bootstrap call itself and `module` the root
 * NgModule.
 */
export type RootConfig =
  | { holder: 'variable'; filePath: string; variable?: string }
  | { holder: 'module'; filePath: string; className?: string }
  | { holder: 'bootstrap'; filePath: string };

const BOOTSTRAP_PACKAGE = '@angular/platform-browser';
const BOOTSTRAP_FUNCTION = 'bootstrapApplication';
const BOOTSTRAP_MODULE_METHOD = 'bootstrapModule';
const MERGE_FUNCTION = 'mergeApplicationConfig';
const EMPTY_PROVIDERS = '{\n  providers: []\n}';

export function locateRootConfig(
  tree: Tree,
  workspace: WorkspaceDefinition,
  project: ProjectDefinition,
  sourceRoot: string,
  context: SchematicContext,
): RootConfig {
  const main = mainFilePath(project, sourceRoot);
  const fromMain = tree.exists(main)
    ? fromBootstrapCall(tree, main, workspace, project, context)
    : null;

  return fromMain ?? fromDefaultLocation(tree, main, sourceRoot, context);
}

/**
 * Not `getMainFilePath`, which only knows Angular's own builders and needs a
 * build target.
 */
function mainFilePath(project: ProjectDefinition, sourceRoot: string) {
  const options = project.targets.get('build')?.options;
  const main = options?.browser ?? options?.main;

  return typeof main === 'string'
    ? normalize(`/${main}`)
    : joinToSourceRoot('main.ts', sourceRoot);
}

function fromBootstrapCall(
  tree: Tree,
  main: string,
  workspace: WorkspaceDefinition,
  project: ProjectDefinition,
  context: SchematicContext,
) {
  const options = {
    ...readCompilerOptions(tree, findTsConfigPath(tree, project)),
    noLib: true,
    types: [],
  };
  const host = createTreeHost(tree);
  const program = createProgram([main], options, host);
  const found = findBootstrapCall(program, main, options, host);

  if (!found) {
    return null;
  }

  const { sourceFile, call } = found;
  const inProject = (filePath: string) =>
    isInsideProject(filePath.slice(1), project, workspace);

  warnAboutFurtherCalls(sourceFile, call, context);

  return isBootstrapModuleCall(call)
    ? fromBootstrapModule(
        call,
        sourceFile.fileName,
        program.getTypeChecker(),
        inProject,
      )
    : fromBootstrapApplication(
        call,
        sourceFile.fileName,
        program.getTypeChecker(),
        inProject,
      );
}

/**
 * Only symbols of the application's own files matter, so nothing in
 * `node_modules` gets parsed. A config from a package counts as out of reach.
 */
function createTreeHost(tree: Tree) {
  const fileExists = (fileName: string) =>
    !fileName.includes('/node_modules/') && tree.exists(fileName);
  const readFile = (fileName: string) =>
    fileExists(fileName) ? tree.readText(fileName) : undefined;

  return {
    fileExists,
    readFile,
    getSourceFile: (fileName, languageVersion) => {
      const text = readFile(fileName);

      return text === undefined
        ? undefined
        : createSourceFile(fileName, text, languageVersion, true);
    },
    getDefaultLibFileName: () => 'lib.d.ts',
    writeFile: () => undefined,
    getCurrentDirectory: () => '/',
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
  } satisfies CompilerHost;
}

/** Breadth-first, so the call nearest to the main file wins. */
function findBootstrapCall(
  program: Program,
  main: string,
  options: CompilerOptions,
  host: CompilerHost,
) {
  const queue = [main];

  for (const filePath of queue) {
    const sourceFile = program.getSourceFile(filePath);
    const call = sourceFile && bootstrapCalls(sourceFile).at(0);

    if (sourceFile && call) {
      return { sourceFile, call };
    }

    const imported = sourceFile
      ? relativeImports(sourceFile).flatMap(
          (specifier) =>
            resolveModuleName(specifier, filePath, options, host).resolvedModule
              ?.resolvedFileName ?? [],
        )
      : [];

    queue.push(...imported.filter((file) => !queue.includes(file)));
  }

  return null;
}

function bootstrapCalls(sourceFile: SourceFile) {
  const isBootstrapCall = bootstrapMatcher(sourceFile);
  const calls: CallExpression[] = [];

  function visit(node: Node) {
    if (isCallExpression(node) && isBootstrapCall(node)) {
      calls.push(node);
    }
    node.forEachChild(visit);
  }

  visit(sourceFile);

  return calls;
}

/**
 * `bootstrapApplication` counts only as imported from Angular, under whatever
 * name, as a local function of that name could do anything.
 */
function bootstrapMatcher(sourceFile: SourceFile) {
  const bindings = sourceFile.statements
    .filter(isImportDeclaration)
    .filter(
      ({ moduleSpecifier }) =>
        isStringLiteralLike(moduleSpecifier) &&
        moduleSpecifier.text === BOOTSTRAP_PACKAGE,
    )
    .map(({ importClause }) => importClause?.namedBindings);
  const named = bindings
    .flatMap((binding) =>
      binding && isNamedImports(binding) ? [...binding.elements] : [],
    )
    .filter(
      ({ name, propertyName }) =>
        (propertyName ?? name).text === BOOTSTRAP_FUNCTION,
    )
    .map(({ name }) => name.text);
  const namespaces = bindings.flatMap((binding) =>
    binding && isNamespaceImport(binding) ? [binding.name.text] : [],
  );

  return ({ expression }: CallExpression) =>
    isIdentifier(expression)
      ? named.includes(expression.text)
      : isPropertyAccessExpression(expression) &&
        (expression.name.text === BOOTSTRAP_MODULE_METHOD ||
          (expression.name.text === BOOTSTRAP_FUNCTION &&
            isIdentifier(expression.expression) &&
            namespaces.includes(expression.expression.text)));
}

function isBootstrapModuleCall({ expression }: CallExpression) {
  return (
    isPropertyAccessExpression(expression) &&
    expression.name.text === BOOTSTRAP_MODULE_METHOD
  );
}

function relativeImports(sourceFile: SourceFile) {
  const specifiers: string[] = [];

  function visit(node: Node) {
    const specifier =
      isImportDeclaration(node) || isExportDeclaration(node)
        ? node.moduleSpecifier
        : isCallExpression(node) &&
            node.expression.kind === SyntaxKind.ImportKeyword
          ? node.arguments.at(0)
          : undefined;

    if (
      specifier &&
      isStringLiteralLike(specifier) &&
      specifier.text.startsWith('.')
    ) {
      specifiers.push(specifier.text);
    }
    node.forEachChild(visit);
  }

  visit(sourceFile);

  return specifiers;
}

function warnAboutFurtherCalls(
  sourceFile: SourceFile,
  call: CallExpression,
  context: SchematicContext,
) {
  if (bootstrapCalls(sourceFile).length > 1) {
    const { line } = sourceFile.getLineAndCharacterOfPosition(call.getStart());

    context.logger.warn(
      `${sourceFile.fileName} has several bootstrap calls. Using the one in line ${String(line + 1)}.`,
    );
  }
}

function fromBootstrapApplication(
  call: CallExpression,
  filePath: string,
  checker: TypeChecker,
  inProject: (filePath: string) => boolean,
): RootConfig {
  const config = call.arguments.at(1);
  const declaration =
    config && isIdentifier(config) ? declarationOf(config, checker) : undefined;
  const variable = declaration && editableVariableName(declaration);
  const variableFile = declaration?.getSourceFile().fileName;

  return variable && variableFile && inProject(variableFile)
    ? { holder: 'variable', filePath: variableFile, variable }
    : { holder: 'bootstrap', filePath };
}

function declarationOf(identifier: Expression, checker: TypeChecker) {
  const symbol = checker.getSymbolAtLocation(identifier);

  return (
    symbol && symbol.flags & SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol
  )?.valueDeclaration;
}

function editableVariableName(declaration: Node) {
  return isVariableDeclaration(declaration) &&
    isIdentifier(declaration.name) &&
    isSourceFile(declaration.parent.parent.parent) &&
    declaration.initializer &&
    hasEditableInitializer(declaration.initializer)
    ? declaration.name.text
    : null;
}

function fromBootstrapModule(
  call: CallExpression,
  filePath: string,
  checker: TypeChecker,
  inProject: (filePath: string) => boolean,
): RootConfig {
  const argument = call.arguments.at(0);
  const declaration =
    argument && isIdentifier(argument)
      ? declarationOf(argument, checker)
      : undefined;

  if (
    !declaration ||
    !isClassDeclaration(declaration) ||
    !inProject(declaration.getSourceFile().fileName)
  ) {
    throw new SchematicsException(
      `Could not edit the root NgModule "${argument?.getText() ?? ''}" bootstrapped in ${filePath}. It has to be a class declared in this project.`,
    );
  }

  return {
    holder: 'module',
    filePath: declaration.getSourceFile().fileName,
    className: declaration.name?.text,
  };
}

function fromDefaultLocation(
  tree: Tree,
  main: string,
  sourceRoot: string,
  context: SchematicContext,
): RootConfig {
  const filePath = joinToSourceRoot(DEFAULT_APP_CONFIG_FILE, sourceRoot);

  if (!tree.exists(filePath)) {
    throw new SchematicsException(
      `Could not find the application's root providers. Checked ${main} and ${filePath}.`,
    );
  }

  context.logger.warn(
    `Found no bootstrap call from ${main}. Using ${filePath} for the root providers.`,
  );

  return { holder: 'variable', filePath };
}

/** The object whose `providers` array holds the root providers. */
export function findProvidersOwner(
  sourceFile: SourceFile,
  rootConfig: RootConfig,
): ObjectLiteralExpression | null {
  switch (rootConfig.holder) {
    case 'variable':
      return findVariableWithObjectLiteral(
        sourceFile,
        ({ name, initializer }) =>
          rootConfig.variable
            ? isIdentifier(name) && name.text === rootConfig.variable
            : !!initializer && hasEditableInitializer(initializer),
      );
    case 'module':
      return moduleMetadata(sourceFile, rootConfig.className);
    case 'bootstrap':
      return bootstrapConfigObject(bootstrapApplicationCall(sourceFile));
  }
}

function hasEditableInitializer(initializer: Expression) {
  const owner = unwrapToObjectLiteral(initializer);

  return !!owner && hasEditableProviders(owner);
}

function bootstrapApplicationCall(sourceFile: SourceFile) {
  return (
    bootstrapCalls(sourceFile).find((call) => !isBootstrapModuleCall(call)) ??
    null
  );
}

function moduleMetadata(sourceFile: SourceFile, className: string | undefined) {
  const declaration = findClass(sourceFile, className);
  const decorators =
    declaration && canHaveDecorators(declaration)
      ? (getDecorators(declaration) ?? [])
      : [];

  return (
    decorators
      .map(({ expression }) =>
        isCallExpression(expression) &&
        isCallee(expression.expression, 'NgModule')
          ? expression.arguments.at(0)
          : undefined,
      )
      .find(isObjectLiteralArgument) ?? null
  );
}

function isObjectLiteralArgument(
  metadata: Expression | undefined,
): metadata is ObjectLiteralExpression {
  return !!metadata && isObjectLiteralExpression(metadata);
}

function findClass(
  node: Node,
  className: string | undefined,
): ClassDeclaration | undefined {
  return node.forEachChild((child) =>
    isClassDeclaration(child) && child.name?.text === className
      ? child
      : findClass(child, className),
  );
}

/**
 * A bootstrap call or an NgModule need not have a `providers` array yet. A
 * config whose contents are out of reach, such as a function call, stays as it
 * is and gets merged with a config object that has one.
 */
export function addMissingProviders(
  tree: Tree,
  sourceFile: SourceFile,
  rootConfig: RootConfig,
): void {
  const recorder = tree.beginUpdate(rootConfig.filePath);

  applyToUpdateRecorder(
    recorder,
    rootConfig.holder === 'module'
      ? moduleChanges(sourceFile, rootConfig.filePath, rootConfig.className)
      : rootConfig.holder === 'bootstrap'
        ? bootstrapChanges(sourceFile, rootConfig.filePath)
        : [],
  );
  tree.commitUpdate(recorder);
}

function moduleChanges(
  sourceFile: SourceFile,
  filePath: string,
  className: string | undefined,
) {
  const owner = moduleMetadata(sourceFile, className);

  if (!owner) {
    throw new SchematicsException(
      `Could not find the @NgModule metadata of "${className ?? 'default'}" in ${filePath}. It has to be an object in the decorator.`,
    );
  }

  const providers = findProvidersProperty(owner);

  if (hasEditableProviders(owner)) {
    return [];
  }

  if (owner.properties.some(isSpreadAssignment)) {
    throw new SchematicsException(
      `Could not add the root providers to the @NgModule in ${filePath}, as its metadata spreads another object.`,
    );
  }

  return !providers
    ? insertIntoObject(owner, filePath)
    : isPropertyAssignment(providers)
      ? [
          new InsertChange(filePath, providers.initializer.getStart(), '['),
          new InsertChange(filePath, providers.initializer.getEnd(), ']'),
        ]
      : [new InsertChange(filePath, providers.getEnd(), ': [providers]')];
}

function bootstrapChanges(sourceFile: SourceFile, filePath: string) {
  const call = bootstrapApplicationCall(sourceFile);
  const config = call?.arguments.at(1);

  return !call || bootstrapConfigObject(call)
    ? []
    : !config
      ? insertAsArgument(call, filePath)
      : isMergeCall(config)
        ? insertAsArgument(config, filePath)
        : isObjectLiteralExpression(config) && acceptsProviders(config)
          ? insertIntoObject(config, filePath)
          : wrapInMergeCall(sourceFile, config, filePath);
}

/** A spread further down would replace an array added at the top. */
function acceptsProviders(object: ObjectLiteralExpression) {
  return (
    !findProvidersProperty(object) &&
    !object.properties.some(isSpreadAssignment)
  );
}

function insertIntoObject(owner: ObjectLiteralExpression, filePath: string) {
  return [
    new InsertChange(
      filePath,
      owner.getStart() + 1,
      `\n  providers: []${owner.properties.length > 0 ? ',' : '\n'}`,
    ),
  ];
}

/** After the last argument, as the call may end in a trailing comma. */
function insertAsArgument(call: CallExpression, filePath: string) {
  const lastArgument = call.arguments.at(-1);

  return [
    lastArgument
      ? new InsertChange(
          filePath,
          lastArgument.getEnd(),
          `, ${EMPTY_PROVIDERS}`,
        )
      : new InsertChange(filePath, call.getEnd() - 1, EMPTY_PROVIDERS),
  ];
}

function wrapInMergeCall(
  sourceFile: SourceFile,
  config: Expression,
  filePath: string,
) {
  return [
    insertNamedImport(sourceFile, filePath, MERGE_FUNCTION, '@angular/core'),
    new InsertChange(filePath, config.getStart(), `${MERGE_FUNCTION}(`),
    new InsertChange(filePath, config.getEnd(), `, ${EMPTY_PROVIDERS})`),
  ];
}

/**
 * `insertImport` takes a namespace import as already providing the symbol, but
 * the call it is imported for uses the bare name.
 */
export function insertNamedImport(
  sourceFile: SourceFile,
  filePath: string,
  symbol: string,
  packageName: string,
): Change {
  const bindings = sourceFile.statements
    .filter(isImportDeclaration)
    .filter(
      ({ moduleSpecifier }) =>
        isStringLiteralLike(moduleSpecifier) &&
        moduleSpecifier.text === packageName,
    )
    .map((declaration) => ({
      declaration,
      binding: declaration.importClause?.namedBindings,
    }));
  const isNamed = bindings.some(
    ({ binding }) =>
      binding &&
      isNamedImports(binding) &&
      binding.elements.some(({ name }) => name.text === symbol),
  );
  const namespaced = bindings.find(
    ({ binding }) => binding && isNamespaceImport(binding),
  );

  return namespaced && !isNamed
    ? new InsertChange(
        filePath,
        namespaced.declaration.getEnd(),
        `\nimport { ${symbol} } from '${packageName}';`,
      )
    : insertImport(sourceFile, filePath, symbol, packageName);
}

function bootstrapConfigObject(call: CallExpression | null) {
  const config = call?.arguments.at(1);
  const candidates =
    config && isMergeCall(config)
      ? config.arguments.filter(isObjectLiteralExpression)
      : config && isObjectLiteralExpression(config)
        ? [config]
        : [];

  return candidates.find(hasEditableProviders) ?? null;
}

function isMergeCall(node: Expression): node is CallExpression {
  return isCallExpression(node) && isCallee(node.expression, MERGE_FUNCTION);
}

/** A spread after the array can replace it, so adding to it may do nothing. */
function hasEditableProviders(object: ObjectLiteralExpression) {
  const providers = findProvidersProperty(object);

  return (
    !!providers &&
    isPropertyAssignment(providers) &&
    isArrayLiteralExpression(providers.initializer) &&
    !object.properties
      .slice(object.properties.indexOf(providers) + 1)
      .some(isSpreadAssignment)
  );
}
