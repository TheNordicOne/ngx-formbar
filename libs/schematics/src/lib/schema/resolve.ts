import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { SourceFile, Type, TypeChecker } from 'typescript';
import { createTreeProgram } from './program';
import { SchemaContext } from './schema';

export function parseTypeReference(reference: string): {
  filePath: string;
  exportName: string;
} {
  const [filePath, exportName] = reference.split('#');

  if (!filePath || !exportName) {
    throw new SchematicsException(
      `Invalid type reference "${reference}". Expected "path/to/file.ts#ExportName".`,
    );
  }

  return { filePath, exportName };
}

export function resolveContentType(
  tree: Tree,
  ctx: SchemaContext,
): { type: Type; checker: TypeChecker; coreRoot: string } {
  const { filePath, exportName } = parseTypeReference(ctx.typeReference);
  const absolutePath = `/${ctx.projectRoot}/${filePath}`;

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

  return {
    type: findExportedType(checker, sourceFile, exportName, absolutePath),
    checker,
    coreRoot: resolveCoreRoot(program.getSourceFiles()),
  };
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
  const marker = '/@ngx-formbar/core/';
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
