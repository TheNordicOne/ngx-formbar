import { Tree } from '@angular-devkit/schematics';
import {
  createTreeCompilerHost,
  readCompilerOptions,
} from '@ngx-formbar/setup';
import { createProgram, Program, TypeChecker } from 'typescript';

export function createTreeProgram(
  tree: Tree,
  tsConfigPath: string,
  rootNames: string[],
): { program: Program; checker: TypeChecker } {
  const options = readCompilerOptions(tree, tsConfigPath);
  const program = createProgram(
    rootNames,
    options,
    createTreeCompilerHost(tree),
  );

  return { program, checker: program.getTypeChecker() };
}
