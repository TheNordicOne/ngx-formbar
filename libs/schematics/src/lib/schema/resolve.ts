import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { SourceFile, Type, TypeChecker, TypeFlags } from 'typescript';
import { createTreeProgram } from './program';
import { SchemaContext } from './schema';
import { CORE_PACKAGE_NAME } from '../shared/constants';
import { normalizePath, parseTypeReference } from '../shared/type-reference';

export function resolveContentType(
  tree: Tree,
  ctx: SchemaContext,
): { type: Type; checker: TypeChecker; coreRoot: string } {
  const { filePath, exportName } = parseTypeReference(ctx.typeReference);
  const absolutePath = normalizePath(`${ctx.projectRoot}/${filePath}`);

  if (!tree.exists(absolutePath)) {
    throw new SchematicsException(`Type file not found: ${absolutePath}`);
  }

  const { program, checker } = createTreeProgram(tree, ctx.tsConfigPath, [
    absolutePath,
  ]);
  const sourceFile = program.getSourceFile(absolutePath);

  if (!sourceFile) {
    throw new SchematicsException(`Could not parse ${absolutePath}`);
  }

  const type = findExportedType(checker, sourceFile, exportName, absolutePath);

  assertNonEmptyUnion(type, exportName, filePath);

  return {
    type,
    checker,
    coreRoot: resolveCoreRoot(program.getSourceFiles()),
  };
}

/**
 * A freshly-seeded content union (`export type AppContent = never;`) has no
 * members yet, and an untouched union imports nothing from
 * `@ngx-formbar/core`, so core never enters the program and
 * `resolveCoreRoot` below would fail first with an unrelated "is it
 * installed?" message. Checking for `never` here, before that lookup runs,
 * is what lets a fresh consumer see a message that actually names their
 * problem instead of one about a missing dependency they do have.
 */
function assertNonEmptyUnion(type: Type, exportName: string, filePath: string) {
  if ((type.flags & TypeFlags.Never) === 0) {
    return;
  }

  throw new SchematicsException(
    `"${exportName}" in ${filePath} has no members yet, so there is nothing to build a schema from. Scaffold a control, group, block, or array to add to the union, or add members to it by hand.`,
  );
}

function findExportedType(
  checker: TypeChecker,
  sourceFile: SourceFile,
  exportName: string,
  absolutePath: string,
) {
  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);

  if (!moduleSymbol) {
    throw new SchematicsException(`${absolutePath} exports nothing.`);
  }

  const exported = checker
    .getExportsOfModule(moduleSymbol)
    .find((symbol) => symbol.getName() === exportName);

  if (!exported) {
    throw new SchematicsException(
      `${absolutePath} has no exported type named "${exportName}".`,
    );
  }

  return checker.getDeclaredTypeOfSymbol(exported);
}

/** Directory of the consumer's installed @ngx-formbar/core, used to anchor base-type checks. */
function resolveCoreRoot(sourceFiles: readonly SourceFile[]) {
  const marker = `/${CORE_PACKAGE_NAME}/`;
  const coreFile = sourceFiles.find((file) => file.fileName.includes(marker));

  if (!coreFile) {
    throw new SchematicsException(
      'Could not resolve @ngx-formbar/core from the project. Is it installed?',
    );
  }

  return coreFile.fileName.slice(
    0,
    coreFile.fileName.indexOf(marker) + marker.length,
  );
}
