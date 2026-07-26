import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { runInThisContext } from 'node:vm';
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript';
import { SCHEMATICS_PACKAGE_NAME } from '../../shared/constants';
import { toJsonTypes } from '../json-types';
import { defineEmitter, Emitter } from './define-emitter';

const RELATIVE_CANDIDATES = ['', '.ts', '.js', '/index.ts', '/index.js'];

/**
 * The runtime surface an emitter imports from this package. Serving it from the
 * running process keeps `defineEmitter` a single instance whatever the consumer's
 * install layout resolves to, so anything emitters may call must be listed here.
 */
const OWN_EXPORTS: Record<string, unknown> = { defineEmitter, toJsonTypes };

/**
 * The two path spaces an emitter is loaded across: emitter sources are read from the
 * virtual `tree`, while bare specifiers resolve on disk from the real `workspaceRoot`.
 */
export interface LoadHost {
  tree: Tree;
  workspaceRoot: string;
}

type ModuleWrapper = (
  exports: unknown,
  require: (specifier: string) => unknown,
  module: { exports: unknown },
  filename: string,
  directory: string,
) => void;

/** Loads a `.ts` emitter by transpiling it with the peer TypeScript, then evaluating it. */
export function loadFromPath(host: LoadHost, absolutePath: string): Emitter {
  return toEmitter(loadModule(host, absolutePath), absolutePath);
}

export function loadFromPackage(
  specifier: string,
  workspaceRoot: string,
): Emitter {
  const [packageName, exportName] = specifier.split('#');
  const loaded: unknown = requireFrom(workspaceRoot)(packageName);

  return toEmitter(exportName ? pick(loaded, exportName) : loaded, specifier);
}

function loadModule(host: LoadHost, absolutePath: string): unknown {
  const source = host.tree.read(absolutePath);

  if (!source) {
    throw new SchematicsException(`Emitter file not found: ${absolutePath}`);
  }

  const text = source.toString('utf-8');
  const javaScript = absolutePath.endsWith('.ts')
    ? transpileModule(text, {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
        fileName: absolutePath,
      }).outputText
    : text;

  return evaluate(host, javaScript, absolutePath);
}

/**
 * Wraps the transpiled source the way Node wraps a CommonJS module and runs it.
 * Relative specifiers are served from the Tree, so a multi-file emitter works and
 * sees files a chained schematic has written but not yet flushed to disk. Bare
 * specifiers fall through to Node resolution from the workspace root, because the
 * emitter's own path exists only in the Tree and resolves nothing on disk.
 */
function evaluate(host: LoadHost, javaScript: string, filename: string) {
  const shim: { exports: unknown } = { exports: {} };
  const nodeRequire = requireFrom(host.workspaceRoot);

  const localRequire = (specifier: string): unknown => {
    if (specifier === SCHEMATICS_PACKAGE_NAME) {
      return OWN_EXPORTS;
    }

    if (!specifier.startsWith('.')) {
      const resolved: unknown = nodeRequire(specifier);
      return resolved;
    }

    return loadModule(host, resolveInTree(host.tree, filename, specifier));
  };

  // `runInThisContext` is untyped; the signature is fixed by the wrapper compiled here.
  const wrapped = runInThisContext(
    `(function (exports, require, module, __filename, __dirname) {${javaScript}\n})`,
    { filename },
  ) as ModuleWrapper;

  wrapped(shim.exports, localRequire, shim, filename, dirname(filename));

  return shim.exports;
}

function resolveInTree(tree: Tree, filename: string, specifier: string) {
  const base = resolve(dirname(filename), specifier);
  const found = RELATIVE_CANDIDATES.map((suffix) => `${base}${suffix}`).find(
    (candidate) => tree.exists(candidate),
  );

  if (!found) {
    throw new SchematicsException(
      `Emitter ${filename} imports "${specifier}", which was not found in the workspace.`,
    );
  }

  return found;
}

function requireFrom(workspaceRoot: string) {
  return createRequire(resolve(workspaceRoot, 'package.json'));
}

function pick(loaded: unknown, exportName: string) {
  return isRecord(loaded) ? loaded[exportName] : undefined;
}

function toEmitter(loaded: unknown, specifier: string): Emitter {
  const candidate =
    isRecord(loaded) && 'default' in loaded ? loaded['default'] : loaded;

  if (!isEmitter(candidate)) {
    throw new SchematicsException(
      `"${specifier}" does not export an emitter created with defineEmitter().`,
    );
  }

  return candidate;
}

function isEmitter(value: unknown): value is Emitter {
  return (
    isRecord(value) &&
    typeof value['name'] === 'string' &&
    typeof value['emit'] === 'function'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
