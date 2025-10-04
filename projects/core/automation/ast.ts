import { SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  ObjectLiteralExpression,
  Project,
  SourceFile,
  SyntaxKind,
} from 'ts-morph';

/** Load a TS file into an in‑memory ts-morph SourceFile */
export function getSourceFile(tree: Tree, filePath: string): SourceFile {
  const buffer = tree.read(filePath);
  if (!buffer) {
    throw new SchematicsException(`Cannot find ${filePath}`);
  }
  const content = buffer.toString('utf-8');
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: { allowJs: true, target: 3 },
    skipFileDependencyResolution: true,
  });
  return project.createSourceFile(filePath, content, { overwrite: true });
}

/** Find the exported const componentRegistrations = { … } in a file */
export function findRegistrationsObject(
  source: SourceFile,
): ObjectLiteralExpression {
  const varDecl = source
    .getVariableDeclarations()
    .find(
      (d) => d.getName() === 'componentRegistrations' && d.hasExportKeyword(),
    );

  if (!varDecl) {
    throw new SchematicsException(
      `No exported 'componentRegistrations' found in ${source.getBaseName()}`,
    );
  }

  const init = varDecl.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
  if (!init) {
    throw new SchematicsException(
      `Expected 'componentRegistrations' to be initialized with an object literal in ${source.getBaseName()}`,
    );
  }

  return init;
}

/** Upsert a key→className into an ObjectLiteralExpression */
export function upsertObjectLiteral(
  objLit: ObjectLiteralExpression,
  key: string,
  className: string,
) {
  if (objLit.getProperty(key)) {
    return; // already exists
  }
  objLit.addPropertyAssignment({ name: key, initializer: className });
}
