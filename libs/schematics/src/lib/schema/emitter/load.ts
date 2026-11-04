import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { createRequire } from 'node:module';
import { dirname, join, posix, resolve } from 'node:path';
import { runInThisContext } from 'node:vm';
import {
  flattenDiagnosticMessageText,
  ModuleKind,
  ScriptTarget,
  transpileModule,
} from 'typescript';
import { SCHEMATICS_PACKAGE_NAME } from '../../shared/constants';
import { toJsonTypes } from '../json-types';
import { defineEmitter, Emitter } from './define-emitter';

const RELATIVE_CANDIDATES = ['', '.ts', '.js', '/index.ts', '/index.js'];

/**
 * The runtime surface a path-loaded emitter imports from this package. Serving it
 * from the running process means the emitter calls the same code that built the
 * model, whatever copy the consumer's install layout would resolve, so anything
 * emitters may call must be listed here. Package emitters load through Node's
 * `require` and resolve this package themselves.
 * `emitter-exports.spec.ts` fails when a new runtime export is neither listed here
 * nor explicitly withheld.
 */
export const OWN_EXPORTS = { defineEmitter, toJsonTypes };

/**
 * Narrowing the package down to `OWN_EXPORTS` is otherwise silent: an unlisted
 * import would be `undefined` and fail somewhere unrelated. The trap names it.
 *
 * `__esModule` and `default` answer the CommonJS interop probes rather than falling
 * through to the trap. The package has no default export, so `default` serves the
 * object itself, which is what `esModuleInterop` synthesises in the consumer's editor:
 * every import form then reaches the same instance a named import does.
 *
 * `then` answers `undefined` rather than trapping: an emitter awaiting a dynamic
 * `import()` has that transpile to a promise chain whose resolution value is this
 * proxy, and resolving a promise with a value probes `.then` on it to decide whether
 * to assimilate it as a thenable. Trapping that probe would break the awaited form
 * for every emitter, not just ones that actually import a `then` export.
 */
const SERVED_EXPORTS = new Proxy<Record<string, unknown>>(OWN_EXPORTS, {
  get(target, key) {
    if (typeof key === 'symbol') {
      return undefined;
    }

    if (key === '__esModule') {
      return true;
    }

    if (key === 'default') {
      return SERVED_EXPORTS;
    }

    if (key === 'then') {
      return undefined;
    }

    if (Object.prototype.hasOwnProperty.call(target, key)) {
      return target[key];
    }

    throw new SchematicsException(
      `"${key}" is not available to emitters from ${SCHEMATICS_PACKAGE_NAME}.`,
    );
  },
});

/**
 * The two path spaces an emitter is loaded across: emitter sources are read from the
 * virtual `tree`, while bare specifiers resolve on disk from the real `workspaceRoot`.
 */
export interface LoadHost {
  tree: Tree;
  workspaceRoot: string;
}

/** Node's module record, reduced to the part the CommonJS wrapper is handed. */
interface ModuleRecord {
  exports: unknown;
}

interface LoadContext {
  host: LoadHost;
  /**
   * Node's module cache, per load. Without it a module imported from two emitter
   * files is instantiated twice, and a cycle between two files recurses forever
   * instead of seeing the partial exports Node would hand it.
   */
  modules: Map<string, ModuleRecord>;
}

type ModuleWrapper = (
  exports: unknown,
  require: (specifier: string) => unknown,
  module: ModuleRecord,
  filename: string,
  directory: string,
) => void;

export function loadFromPath(host: LoadHost, absolutePath: string): Emitter {
  const context: LoadContext = { host, modules: new Map() };

  return toEmitter(loadModule(context, absolutePath), absolutePath);
}

export function loadFromPackage(
  specifier: string,
  workspaceRoot: string,
): Emitter {
  const [packageName, exportName] = specifier.split('#');
  // `resolve`, not `join`: it anchors absolutely even if `workspaceRoot` is not.
  // `requireFrom` needs the opposite for its '/'-rooted Tree path (see there).
  const nodeRequire = createRequire(resolve(workspaceRoot, 'package.json'));
  const loaded: unknown = nodeRequire(packageName);

  return toEmitter(exportName ? pick(loaded, exportName) : loaded, specifier);
}

function loadModule(context: LoadContext, absolutePath: string) {
  const cached = context.modules.get(absolutePath);

  if (cached) {
    return cached.exports;
  }

  const source = context.host.tree.read(absolutePath);

  if (!source) {
    throw new SchematicsException(`Emitter file not found: ${absolutePath}`);
  }

  const javaScript = compile(source.toString('utf-8'), absolutePath);
  const record: ModuleRecord = { exports: {} };

  // Cached before evaluation so a cyclic import resolves to the partial exports.
  context.modules.set(absolutePath, record);
  evaluate(context, record, javaScript, absolutePath);

  return record.exports;
}

/**
 * `.js` siblings are already CommonJS and pass through untouched, and `.json`
 * siblings become the value of their module. `esModuleInterop`
 * matches what the generated workspace tsconfig implies, so a default import that
 * type-checks in the consumer's editor is not `undefined` at emit time.
 */
function compile(text: string, absolutePath: string) {
  if (absolutePath.endsWith('.json')) {
    return `module.exports = ${text};`;
  }

  if (!absolutePath.endsWith('.ts')) {
    return text;
  }

  const { outputText, diagnostics } = transpileModule(text, {
    compilerOptions: {
      module: ModuleKind.CommonJS,
      target: ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: absolutePath,
    reportDiagnostics: true,
  });

  const failure = diagnostics?.at(0);

  if (failure) {
    throw new SchematicsException(
      `Emitter ${absolutePath} failed to compile: ${flattenDiagnosticMessageText(failure.messageText, ' ')}`,
    );
  }

  return outputText;
}

/**
 * Wraps the transpiled source the way Node wraps a CommonJS module and runs it.
 * Relative specifiers are served from the Tree, so a multi-file emitter works and
 * sees files a chained schematic has written but not yet flushed to disk. Bare
 * specifiers fall through to Node resolution on disk, because the emitter's own
 * path exists only in the Tree and resolves nothing there. `__filename` and
 * `__dirname` hold the path on disk, as an emitter passes them to Node APIs.
 */
function evaluate(
  context: LoadContext,
  record: ModuleRecord,
  javaScript: string,
  filename: string,
) {
  function localRequire(specifier: string) {
    if (specifier === SCHEMATICS_PACKAGE_NAME) {
      return SERVED_EXPORTS;
    }

    if (specifier.startsWith('.')) {
      const path = resolveInTree(context.host.tree, filename, specifier);
      return loadModule(context, path);
    }

    // Two steps on purpose: a `require` from `createRequire` returns `any`, which
    // `@typescript-eslint/no-unsafe-return` rejects when returned directly.
    const resolved: unknown = requireFrom(context.host, filename)(specifier);
    return resolved;
  }

  const run = wrapInFunction(javaScript, filename);
  const diskPath = join(context.host.workspaceRoot, filename);

  run(record.exports, localRequire, record, diskPath, dirname(diskPath));
}

function wrapInFunction(javaScript: string, filename: string) {
  try {
    // `runInThisContext` is untyped; the signature is fixed by the wrapper compiled here.
    return runInThisContext(
      `(function (exports, require, module, __filename, __dirname) {${javaScript}\n})`,
      { filename },
    ) as ModuleWrapper;
  } catch (error) {
    throw new SchematicsException(
      `Emitter ${filename} failed to compile: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/** Tree paths are virtual and '/'-rooted on every platform, so `posix` walks them. */
function resolveInTree(tree: Tree, filename: string, specifier: string) {
  const base = posix.resolve(posix.dirname(filename), specifier);
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

/**
 * Tree paths are '/'-rooted at `workspaceRoot`, so joining the two maps the emitter's
 * directory into real-path space. Anchoring resolution there lets a project-local
 * `node_modules` win, instead of only what a monorepo happened to hoist to the root.
 * `createRequire` never checks that the anchor exists.
 */
function requireFrom(host: LoadHost, filename: string) {
  return createRequire(join(host.workspaceRoot, filename));
}

function pick(loaded: unknown, exportName: string) {
  return isRecord(loaded) ? loaded[exportName] : undefined;
}

function toEmitter(loaded: unknown, specifier: string) {
  const candidate =
    isRecord(loaded) && 'default' in loaded ? loaded['default'] : loaded;

  if (!isEmitter(candidate)) {
    throw new SchematicsException(
      `"${specifier}" does not export an emitter (an object with a string "name" and an "emit" function).`,
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
