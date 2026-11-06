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

/**
 * Where a Tree path lies under `workspaceRoot`. TypeScript takes forward slashes
 * on every platform.
 */
export function pathUnderRoot(path: string, workspaceRoot: string): string {
  return `${rootPrefix(workspaceRoot)}${path.startsWith('/') ? path : `/${path}`}`;
}

function rootPrefix(workspaceRoot: string) {
  return workspaceRoot.replace(/\\/g, '/').replace(/\/$/, '');
}

/** `null` for a file above the root, which only the disk has. */
export function treePath(
  fileName: string,
  workspaceRoot: string,
): string | null {
  const prefix = rootPrefix(workspaceRoot);

  return fileName === prefix
    ? '/'
    : fileName.startsWith(`${prefix}/`)
      ? fileName.slice(prefix.length)
      : null;
}

/**
 * `workspaceRoot` is where the Tree root lies on disk. A real one makes the
 * compiler see the real location of every file, so whatever points above the
 * Tree resolves: packages installed above it, an `extends` or a path mapping.
 */
export function readCompilerOptions(
  tree: Tree,
  tsConfigPath: string,
  workspaceRoot = '/',
): CompilerOptions {
  const fallback: CompilerOptions = {
    target: ScriptTarget.ES2022,
    module: ModuleKind.ESNext,
    moduleResolution: ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: true,
  };

  // `baseUrl`, `paths` and `typeRoots` resolve against this, unrooted otherwise.
  const configPath = pathUnderRoot(tsConfigPath, workspaceRoot);
  const raw = readTreeOrDisk(tree, configPath, workspaceRoot);

  if (raw === undefined) {
    return fallback;
  }

  const parsed = parseConfigFileTextToJson(configPath, raw);
  const configured = parseJsonConfigFileContent(
    parsed.config ?? {},
    createTreeParseConfigHost(tree, workspaceRoot),
    posix.dirname(configPath),
  );

  return { ...fallback, ...configured.options };
}

/** Resolves "extends" chains against the Tree, so a virtual tsconfig never
 * falls through to an unrelated real tsconfig on disk. */
function createTreeParseConfigHost(tree: Tree, workspaceRoot: string) {
  return {
    useCaseSensitiveFileNames: true,
    readDirectory: () => [],
    fileExists: (fileName) =>
      existsInTree(tree, fileName, workspaceRoot) || existsSync(fileName),
    readFile: (fileName) => readTreeOrDisk(tree, fileName, workspaceRoot),
  } satisfies ParseConfigHost;
}

function existsInTree(tree: Tree, fileName: string, workspaceRoot: string) {
  const path = treePath(fileName, workspaceRoot);

  return path !== null && tree.exists(path);
}

/**
 * A compiler host over the Tree, rooted at `workspaceRoot`. With `ownFilesOnly`,
 * nothing in `node_modules` or on disk is read, which is for a program that only
 * needs the symbols of the application's own files and takes `noLib`.
 */
export function createTreeCompilerHost(
  tree: Tree,
  {
    ownFilesOnly = false,
    workspaceRoot = '/',
  }: { ownFilesOnly?: boolean; workspaceRoot?: string } = {},
): CompilerHost {
  const fileExists = (fileName: string) =>
    ownFilesOnly
      ? !fileName.includes('/node_modules/') &&
        existsInTree(tree, fileName, workspaceRoot)
      : existsInTree(tree, fileName, workspaceRoot) || existsSync(fileName);
  const readFile = (fileName: string) =>
    fileExists(fileName)
      ? readTreeOrDisk(tree, fileName, workspaceRoot)
      : undefined;

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
    getCurrentDirectory: () => rootPrefix(workspaceRoot) || '/',
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    directoryExists: (directoryName) =>
      treeDirectoryExists(tree, directoryName, workspaceRoot),
    getDirectories: (directoryName) =>
      treeDirectories(tree, directoryName, workspaceRoot),
  };
}

/**
 * `getDir` throws at or below a file. TypeScript asks for a file when an import
 * names one that is not a module, and for what is below a Yarn archive.
 */
function treeDir(tree: Tree, directoryName: string, workspaceRoot: string) {
  const path = treePath(directoryName, workspaceRoot);

  return path === null || isAtOrBelowFile(tree, path)
    ? null
    : tree.getDir(path);
}

function isAtOrBelowFile(tree: Tree, path: string) {
  const segments = path.split('/').filter(Boolean);

  return segments.some((_, index) =>
    tree.exists(`/${segments.slice(0, index + 1).join('/')}`),
  );
}

/** A Tree directory "exists" once it has any child file or subdirectory;
 * `getDir` never throws for unknown paths, it just comes back empty. */
function treeDirectoryExists(
  tree: Tree,
  directoryName: string,
  workspaceRoot: string,
) {
  const dir = treeDir(tree, directoryName, workspaceRoot);

  return (
    !!dir?.subfiles.length ||
    !!dir?.subdirs.length ||
    sys.directoryExists(directoryName)
  );
}

function treeDirectories(
  tree: Tree,
  directoryName: string,
  workspaceRoot: string,
) {
  const inTree = treeDir(tree, directoryName, workspaceRoot)?.subdirs ?? [];
  const diskDirs = sys.directoryExists(directoryName)
    ? sys.getDirectories(directoryName)
    : [];

  return [...new Set([...inTree, ...diskDirs])];
}

/** The Tree is consulted first and the disk is the fallback, as TypeScript's own
 * lib files and everything above the root are only there. */
function readTreeOrDisk(tree: Tree, fileName: string, workspaceRoot: string) {
  const path = treePath(fileName, workspaceRoot);
  const fromTree = path === null ? null : tree.read(path);

  return fromTree ? fromTree.toString('utf-8') : readFromDisk(fileName);
}

function readFromDisk(fileName: string) {
  return existsSync(fileName) ? readFileSync(fileName, 'utf-8') : undefined;
}
