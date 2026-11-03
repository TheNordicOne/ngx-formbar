import { Tree } from '@angular-devkit/schematics';
import { existsSync } from 'node:fs';
import { readCompilerOptions, readTreeOrDisk } from '@ngx-formbar/setup';
import {
  CompilerHost,
  createProgram,
  createSourceFile,
  getDefaultLibFilePath,
  Program,
  sys,
  TypeChecker,
} from 'typescript';

export function createTreeCompilerHost(tree: Tree): CompilerHost {
  return {
    fileExists: (fileName) => tree.exists(fileName) || existsSync(fileName),
    readFile: (fileName) => readTreeOrDisk(tree, fileName),
    getSourceFile: (fileName, languageVersion) => {
      const content = readTreeOrDisk(tree, fileName);
      return content === undefined
        ? undefined
        : createSourceFile(fileName, content, languageVersion, true);
    },
    getDefaultLibFileName: (compilerOptions) =>
      getDefaultLibFilePath(compilerOptions),
    writeFile: () => undefined,
    getCurrentDirectory: () => '/',
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    directoryExists: (directoryName) =>
      treeDirectoryExists(tree, directoryName),
    getDirectories: (directoryName) => treeDirectories(tree, directoryName),
  };
}

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

/** A Tree directory "exists" once it has any child file or subdirectory;
 * `getDir` never throws for unknown paths, it just comes back empty. */
function treeDirectoryExists(tree: Tree, directoryName: string) {
  const dir = tree.getDir(directoryName);
  return (
    dir.subfiles.length > 0 ||
    dir.subdirs.length > 0 ||
    sys.directoryExists(directoryName)
  );
}

function treeDirectories(tree: Tree, directoryName: string) {
  const dir = tree.getDir(directoryName);
  const diskDirs = sys.directoryExists(directoryName)
    ? sys.getDirectories(directoryName)
    : [];

  return [...new Set([...dir.subdirs, ...diskDirs])];
}
