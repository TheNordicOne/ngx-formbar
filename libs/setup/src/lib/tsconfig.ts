import { Tree } from '@angular-devkit/schematics';
import { ProjectDefinition } from '@schematics/angular/utility/workspace';
import { existsSync, readFileSync } from 'node:fs';
import { posix } from 'node:path';
import {
  CompilerHost,
  CompilerOptions,
  createSourceFile,
  getDefaultLibFilePath,
  ModuleKind,
  ModuleResolutionKind,
  ParseConfigHost,
  parseConfigFileTextToJson,
  parseJsonConfigFileContent,
  ScriptTarget,
  sys,
} from 'typescript';

/**
 * The tsconfig of the project's `build` target, then the candidates. The target
 * is what makes `schema --project` work for a library, which has no
 * `tsconfig.app.json`.
 */
export function findTsConfigPath(
  tree: Tree,
  project: ProjectDefinition,
): string {
  const configured = project.targets.get('build')?.options?.['tsConfig'];
  const candidates = [
    ...(typeof configured === 'string' ? [configured] : []),
    `${project.root}/tsconfig.app.json`,
    `${project.root}/tsconfig.lib.json`,
    `${project.root}/tsconfig.json`,
    'tsconfig.json',
  ];

  return candidates.find((path) => tree.exists(path)) ?? 'tsconfig.base.json';
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

  // `baseUrl`, `paths` and `typeRoots` resolve against this, unrooted otherwise.
  const configPath = tsConfigPath.startsWith('/')
    ? tsConfigPath
    : `/${tsConfigPath}`;
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
function createTreeParseConfigHost(tree: Tree) {
  return {
    useCaseSensitiveFileNames: true,
    readDirectory: () => [],
    fileExists: (fileName) => tree.exists(fileName) || existsSync(fileName),
    readFile: (fileName) => readTreeOrDisk(tree, fileName),
  } satisfies ParseConfigHost;
}

/**
 * A compiler host over the Tree. With `ownFilesOnly`, nothing in `node_modules`
 * or on disk is read, which is for a program that only needs the symbols of the
 * application's own files and takes `noLib`.
 */
export function createTreeCompilerHost(
  tree: Tree,
  { ownFilesOnly = false }: { ownFilesOnly?: boolean } = {},
): CompilerHost {
  const fileExists = (fileName: string) =>
    ownFilesOnly
      ? !fileName.includes('/node_modules/') && tree.exists(fileName)
      : tree.exists(fileName) || existsSync(fileName);
  const readFile = (fileName: string) =>
    fileExists(fileName) ? readTreeOrDisk(tree, fileName) : undefined;

  return {
    fileExists,
    readFile,
    getSourceFile: (fileName, languageVersion) => {
      const content = readFile(fileName);

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

/** Tree is consulted first, disk is a fallback. `getCurrentDirectory()` is
 * '/', so most paths reaching these helpers are virtual Tree paths, but
 * TypeScript's own lib files legitimately arrive here as real absolute
 * paths through the same functions. The two path spaces overlap by design
 * because TS lib files must resolve from disk. */
export function readTreeOrDisk(
  tree: Tree,
  fileName: string,
): string | undefined {
  const fromTree = tree.read(fileName);
  return fromTree ? fromTree.toString('utf-8') : readFromDisk(fileName);
}

function readFromDisk(fileName: string) {
  return existsSync(fileName) ? readFileSync(fileName, 'utf-8') : undefined;
}
