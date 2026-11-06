import { Tree } from '@angular-devkit/schematics';
import {
  createTreeCompilerHost,
  findWorkspaceRoot,
  pathUnderRoot,
  readCompilerOptions,
} from '@ngx-formbar/setup';
import { createProgram, Program, SourceFile, TypeChecker } from 'typescript';

/**
 * The program sees the real location of every file, so `sourceFileAt` takes the
 * Tree paths the schematics work with.
 */
export function createTreeProgram(
  tree: Tree,
  tsConfigPath: string,
  rootNames: string[],
  workspaceRoot = findWorkspaceRoot(process.cwd()),
): {
  program: Program;
  checker: TypeChecker;
  sourceFileAt: (path: string) => SourceFile | undefined;
} {
  const program = createProgram(
    rootNames.map((name) => pathUnderRoot(name, workspaceRoot)),
    readCompilerOptions(tree, tsConfigPath, workspaceRoot),
    createTreeCompilerHost(tree, { workspaceRoot }),
  );

  return {
    program,
    checker: program.getTypeChecker(),
    sourceFileAt: (path: string) =>
      program.getSourceFile(pathUnderRoot(path, workspaceRoot)),
  };
}
