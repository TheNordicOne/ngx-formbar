import { Tree } from '@angular-devkit/schematics';
import {
  createTreeCompilerHost,
  readCompilerOptions,
} from '@ngx-formbar/setup';
import { createProgram, Program, TypeChecker } from 'typescript';
import { findWorkspaceRoot } from './workspace-root';

export function createTreeProgram(
  tree: Tree,
  tsConfigPath: string,
  rootNames: string[],
  workspaceRoot = findWorkspaceRoot(process.cwd()),
): { program: Program; checker: TypeChecker } {
  const options = readCompilerOptions(tree, tsConfigPath);
  const program = createProgram(
    rootNames,
    options,
    createTreeCompilerHost(tree, { workspaceRoot }),
  );

  return { program, checker: program.getTypeChecker() };
}
