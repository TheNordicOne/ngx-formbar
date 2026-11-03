import { SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  applyToUpdateRecorder,
  Change,
  InsertChange,
} from '@schematics/angular/utility/change';
import {
  insertImport,
  isImported,
} from '@schematics/angular/utility/ast-utils';
import {
  findProvidersProperty,
  findVariableWithObjectLiteral,
  isCallee,
} from '@ngx-formbar/setup';
import {
  CallExpression,
  canHaveDecorators,
  ClassDeclaration,
  Expression,
  getDecorators,
  isCallExpression,
  isClassDeclaration,
  isIdentifier,
  isImportSpecifier,
  isNamespaceImport,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isSpreadAssignment,
  Node,
  ObjectLiteralExpression,
  SourceFile,
} from 'typescript';
import {
  bootstrapCalls,
  hasEditableInitializer,
  hasEditableProviders,
  importBindings,
  isBootstrapModuleCall,
  refersToImport,
  RootConfig,
} from './root-config';

const ANGULAR_CORE = '@angular/core';
const MERGE_FUNCTION = 'mergeApplicationConfig';

interface TextLayout {
  newLine: string;
  indentUnit: string;
}

/** How a file breaks lines and indents, for what gets inserted into it. */
export function textLayout(text: string): TextLayout {
  return {
    newLine: text.includes('\r\n') ? '\r\n' : '\n',
    indentUnit: /^([ \t]+)[^ \t*\r\n]/m.exec(text)?.[1] ?? '  ',
  };
}

function emptyProviders({ newLine, indentUnit }: TextLayout) {
  return `{${newLine}${indentUnit}providers: []${newLine}}`;
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

function bootstrapApplicationCall(sourceFile: SourceFile) {
  return (
    bootstrapCalls(sourceFile).find((call) => !isBootstrapModuleCall(call)) ??
    null
  );
}

function moduleMetadata(sourceFile: SourceFile, className: string) {
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
  className: string,
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
  const layout = textLayout(sourceFile.text);

  applyToUpdateRecorder(
    recorder,
    rootConfig.holder === 'module'
      ? moduleChanges(
          sourceFile,
          rootConfig.filePath,
          rootConfig.className,
          layout,
        )
      : rootConfig.holder === 'bootstrap'
        ? bootstrapChanges(sourceFile, rootConfig.filePath, layout)
        : [],
  );
  tree.commitUpdate(recorder);
}

function moduleChanges(
  sourceFile: SourceFile,
  filePath: string,
  className: string,
  layout: TextLayout,
) {
  const owner = moduleMetadata(sourceFile, className);

  if (!owner) {
    throw new SchematicsException(
      `Could not find the @NgModule metadata of "${className}" in ${filePath}. It has to be an object in the decorator.`,
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
    ? insertIntoObject(owner, filePath, layout)
    : isPropertyAssignment(providers)
      ? [
          new InsertChange(filePath, providers.initializer.getStart(), '['),
          new InsertChange(filePath, providers.initializer.getEnd(), ']'),
        ]
      : [new InsertChange(filePath, providers.getEnd(), ': [providers]')];
}

function bootstrapChanges(
  sourceFile: SourceFile,
  filePath: string,
  layout: TextLayout,
) {
  const call = bootstrapApplicationCall(sourceFile);
  const config = call?.arguments.at(1);

  return !call || bootstrapConfigObject(call)
    ? []
    : !config
      ? insertAsArgument(call, filePath, layout)
      : isMergeCall(config)
        ? insertAsArgument(config, filePath, layout)
        : isObjectLiteralExpression(config) && acceptsProviders(config)
          ? insertIntoObject(config, filePath, layout)
          : wrapInMergeCall(sourceFile, config, filePath, layout);
}

/** A spread further down would replace an array added at the top. */
function acceptsProviders(object: ObjectLiteralExpression) {
  return (
    !findProvidersProperty(object) &&
    !object.properties.some(isSpreadAssignment)
  );
}

function insertIntoObject(
  owner: ObjectLiteralExpression,
  filePath: string,
  { newLine, indentUnit }: TextLayout,
) {
  return [
    new InsertChange(
      filePath,
      owner.getStart() + 1,
      `${newLine}${indentUnit}providers: []${owner.properties.length > 0 ? ',' : newLine}`,
    ),
  ];
}

/** After the last argument, as the call may end in a trailing comma. */
function insertAsArgument(
  call: CallExpression,
  filePath: string,
  layout: TextLayout,
) {
  const lastArgument = call.arguments.at(-1);

  return [
    lastArgument
      ? new InsertChange(
          filePath,
          lastArgument.getEnd(),
          `, ${emptyProviders(layout)}`,
        )
      : new InsertChange(filePath, call.getEnd() - 1, emptyProviders(layout)),
  ];
}

function wrapInMergeCall(
  sourceFile: SourceFile,
  config: Expression,
  filePath: string,
  layout: TextLayout,
) {
  const imported = importBindings(sourceFile, ANGULAR_CORE).find(
    (binding) =>
      isImportSpecifier(binding) &&
      (binding.propertyName ?? binding.name).text === MERGE_FUNCTION,
  );
  const mergeFunction = imported?.name.text ?? MERGE_FUNCTION;

  return [
    ...(imported
      ? []
      : [
          insertNamedImport(sourceFile, filePath, MERGE_FUNCTION, ANGULAR_CORE),
        ]),
    new InsertChange(filePath, config.getStart(), `${mergeFunction}(`),
    new InsertChange(filePath, config.getEnd(), `, ${emptyProviders(layout)})`),
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
  const namespace = importBindings(sourceFile, packageName).find(
    isNamespaceImport,
  );

  return namespace && !isImported(sourceFile, symbol, packageName)
    ? new InsertChange(
        filePath,
        namespace.parent.parent.getEnd(),
        `${textLayout(sourceFile.text).newLine}import { ${symbol} } from '${packageName}';`,
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
  return (
    isCallExpression(node) &&
    refersToImport(node.expression, MERGE_FUNCTION, ANGULAR_CORE)
  );
}
