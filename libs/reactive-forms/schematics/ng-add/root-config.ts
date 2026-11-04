import { normalize } from '@angular-devkit/core';
import {
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import {
  ProjectDefinition,
  WorkspaceDefinition,
} from '@schematics/angular/utility/workspace';
import {
  createTreeCompilerHost,
  findWorkspaceRoot,
  findProvidersProperty,
  findTsConfigPath,
  isInsideProject,
  joinToSourceRoot,
  pathUnderRoot,
  readCompilerOptions,
  treePath,
  unwrapToObjectLiteral,
} from '@ngx-formbar/setup';
import {
  CallExpression,
  CompilerHost,
  CompilerOptions,
  createProgram,
  Expression,
  ImportSpecifier,
  isArrayLiteralExpression,
  isCallExpression,
  isClassDeclaration,
  isExportDeclaration,
  isIdentifier,
  isImportDeclaration,
  isImportSpecifier,
  isNamedImports,
  isNamespaceImport,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isSourceFile,
  isSpreadAssignment,
  isStringLiteralLike,
  isVariableDeclaration,
  NamespaceImport,
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
  | { holder: 'module'; filePath: string; className: string }
  | { holder: 'bootstrap'; filePath: string };

const BOOTSTRAP_PACKAGE = '@angular/platform-browser';
const BOOTSTRAP_FUNCTION = 'bootstrapApplication';
const BOOTSTRAP_MODULE_METHOD = 'bootstrapModule';

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
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const options = {
    ...readCompilerOptions(
      tree,
      findTsConfigPath(tree, project),
      workspaceRoot,
    ),
    noLib: true,
    types: [],
  };
  const host = createTreeCompilerHost(tree, {
    ownFilesOnly: true,
    workspaceRoot,
  });
  const mainOnDisk = pathUnderRoot(main, workspaceRoot);
  const program = createProgram([mainOnDisk], options, host);
  const found = findBootstrapCall(program, mainOnDisk, options, host);

  if (!found) {
    return null;
  }

  const { sourceFile, call } = found;
  const fileOf = (node: Node) =>
    treePath(node.getSourceFile().fileName, workspaceRoot) ??
    node.getSourceFile().fileName;
  const inProject = (filePath: string) =>
    isInsideProject(filePath.slice(1), project, workspace);

  warnAboutFurtherCalls(sourceFile, fileOf(sourceFile), call, context);

  return isBootstrapModuleCall(call)
    ? fromBootstrapModule(call, fileOf, program.getTypeChecker(), inProject)
    : fromBootstrapApplication(
        call,
        fileOf,
        program.getTypeChecker(),
        inProject,
      );
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
      ? importedModules(sourceFile).flatMap(
          (specifier) =>
            resolveModuleName(specifier, filePath, options, host).resolvedModule
              ?.resolvedFileName ?? [],
        )
      : [];

    queue.push(...imported.filter((file) => !queue.includes(file)));
  }

  return null;
}

export function bootstrapCalls(sourceFile: SourceFile): CallExpression[] {
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

function isBootstrapCall(call: CallExpression) {
  return (
    isBootstrapModuleCall(call) ||
    refersToImport(call.expression, BOOTSTRAP_FUNCTION, BOOTSTRAP_PACKAGE)
  );
}

export function importBindings(
  sourceFile: SourceFile,
  packageName: string,
): (ImportSpecifier | NamespaceImport)[] {
  return sourceFile.statements
    .filter(isImportDeclaration)
    .filter(
      ({ moduleSpecifier }) =>
        isStringLiteralLike(moduleSpecifier) &&
        moduleSpecifier.text === packageName,
    )
    .flatMap<ImportSpecifier | NamespaceImport>(({ importClause }) => {
      const bindings = importClause?.namedBindings;

      return !bindings
        ? []
        : isNamedImports(bindings)
          ? [...bindings.elements]
          : [bindings];
    });
}

/**
 * Whether `callee` is that export of the package, under whatever name it is
 * imported. A local function of the same name could do anything.
 */
export function refersToImport(
  callee: Expression,
  exportName: string,
  packageName: string,
): boolean {
  const bindings = importBindings(callee.getSourceFile(), packageName);

  return isIdentifier(callee)
    ? bindings.some(
        (binding) =>
          isImportSpecifier(binding) &&
          binding.name.text === callee.text &&
          (binding.propertyName ?? binding.name).text === exportName,
      )
    : isPropertyAccessExpression(callee) &&
        callee.name.text === exportName &&
        bindings.some(
          (binding) =>
            isNamespaceImport(binding) &&
            binding.name.text === callee.expression.getText(),
        );
}

export function isBootstrapModuleCall({ expression }: CallExpression): boolean {
  return (
    isPropertyAccessExpression(expression) &&
    expression.name.text === BOOTSTRAP_MODULE_METHOD
  );
}

function importedModules(sourceFile: SourceFile) {
  const specifiers: string[] = [];

  function visit(node: Node) {
    const specifier =
      isImportDeclaration(node) || isExportDeclaration(node)
        ? node.moduleSpecifier
        : isCallExpression(node) &&
            node.expression.kind === SyntaxKind.ImportKeyword
          ? node.arguments.at(0)
          : undefined;

    if (specifier && isStringLiteralLike(specifier)) {
      specifiers.push(specifier.text);
    }
    node.forEachChild(visit);
  }

  visit(sourceFile);

  return specifiers;
}

function warnAboutFurtherCalls(
  sourceFile: SourceFile,
  filePath: string,
  call: CallExpression,
  context: SchematicContext,
) {
  if (bootstrapCalls(sourceFile).length > 1) {
    const { line } = sourceFile.getLineAndCharacterOfPosition(call.getStart());

    context.logger.warn(
      `${filePath} has several bootstrap calls. Using the one in line ${String(line + 1)}.`,
    );
  }
}

function fromBootstrapApplication(
  call: CallExpression,
  fileOf: (node: Node) => string,
  checker: TypeChecker,
  inProject: (filePath: string) => boolean,
): RootConfig {
  const config = call.arguments.at(1);
  const declaration =
    config && isIdentifier(config) ? declarationOf(config, checker) : undefined;
  const variable = declaration && editableVariableName(declaration);
  const variableFile = declaration && fileOf(declaration);

  return variable && variableFile && inProject(variableFile)
    ? { holder: 'variable', filePath: variableFile, variable }
    : { holder: 'bootstrap', filePath: fileOf(call) };
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
  fileOf: (node: Node) => string,
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
    !inProject(fileOf(declaration))
  ) {
    throw new SchematicsException(
      `Could not edit the root NgModule "${argument?.getText() ?? ''}" bootstrapped in ${fileOf(call)}. It has to be a class declared in this project.`,
    );
  }

  const moduleFile = fileOf(declaration);
  const className = declaration.name?.text;

  if (!className) {
    throw new SchematicsException(
      `Could not edit the root NgModule in ${moduleFile}. It has to be a named class.`,
    );
  }

  return { holder: 'module', filePath: moduleFile, className };
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

export function hasEditableInitializer(initializer: Expression): boolean {
  const owner = unwrapToObjectLiteral(initializer);

  return !!owner && hasEditableProviders(owner);
}

/** A spread after the array can replace it, so adding to it may do nothing. */
export function hasEditableProviders(object: ObjectLiteralExpression): boolean {
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
