import { Tree } from '@angular-devkit/schematics';
import { existsSync, readFileSync } from 'node:fs';
import { posix } from 'node:path';
import {
  CompilerHost,
  CompilerOptions,
  createProgram,
  createSourceFile,
  getDefaultLibFilePath,
  ModuleKind,
  ModuleResolutionKind,
  ParseConfigHost,
  Program,
  parseJsonConfigFileContent,
  parseConfigFileTextToJson,
  ScriptTarget,
  sys,
  TypeChecker,
} from 'typescript';

/** Reads workspace files from the Tree and everything else from disk. */
export function createTreeCompilerHost(tree: Tree): CompilerHost {
  return {
    fileExists: (fileName) =>
      tree.exists(normalizePath(fileName)) || existsSync(fileName),
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

export function readCompilerOptions(
  tree: Tree,
  tsConfigPath: string,
): CompilerOptions {
  const fallback: CompilerOptions = {
    target: ScriptTarget.ES2022,
    module: ModuleKind.ESNext,
    moduleResolution: ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
  };

  const configPath = normalizePath(tsConfigPath);
  const raw = tree.read(configPath);
  if (!raw) {
    return fallback;
  }

  const parsed = parseConfigFileTextToJson(configPath, raw.toString('utf-8'));
  const configured = parseJsonConfigFileContent(
    parsed.config ?? {},
    createTreeParseConfigHost(tree),
    posix.dirname(configPath),
  );

  return { ...fallback, ...configured.options };
}

/** Resolves "extends" chains against the Tree, so a virtual tsconfig never
 * falls through to an unrelated real tsconfig on disk. */
function createTreeParseConfigHost(tree: Tree): ParseConfigHost {
  return {
    useCaseSensitiveFileNames: true,
    readDirectory: () => [],
    fileExists: (fileName) =>
      tree.exists(normalizePath(fileName)) || existsSync(fileName),
    readFile: (fileName) => readTreeOrDisk(tree, fileName),
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

function readTreeOrDisk(tree: Tree, fileName: string) {
  const fromTree = tree.read(normalizePath(fileName));
  return fromTree ? fromTree.toString('utf-8') : readFromDisk(fileName);
}

/** A Tree directory "exists" once it has any child file or subdirectory;
 * `getDir` never throws for unknown paths, it just comes back empty. */
function treeDirectoryExists(tree: Tree, directoryName: string) {
  const dir = tree.getDir(normalizePath(directoryName));
  return (
    dir.subfiles.length > 0 ||
    dir.subdirs.length > 0 ||
    sys.directoryExists(directoryName)
  );
}

function treeDirectories(tree: Tree, directoryName: string) {
  const dir = tree.getDir(normalizePath(directoryName));
  const diskDirs = sys.directoryExists(directoryName)
    ? sys.getDirectories(directoryName)
    : [];

  return [...new Set([...dir.subdirs, ...diskDirs])];
}

function readFromDisk(fileName: string) {
  return existsSync(fileName) ? readFileSync(fileName, 'utf-8') : undefined;
}

/** Collapses "." and ".." segments so TypeScript's directory-walking module
 * resolution (which probes paths like "/a/../..") never reaches the Tree
 * with a path its normalizer rejects. */
function normalizePath(fileName: string) {
  return posix.resolve('/', fileName);
}
