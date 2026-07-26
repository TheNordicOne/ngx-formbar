import { Tree } from '@angular-devkit/schematics';
import { Emitter, EmitPaths } from './define-emitter';
import { loadFromPackage, loadFromPath } from './load';

/** Task 6 appends the two built-in JSON Schema emitters here. */
const BUILT_INS: Emitter[] = [];

export function resolveEmitter(
  spec: string,
  tree: Tree,
  paths: EmitPaths,
): Emitter {
  const builtIn = BUILT_INS.find((emitter) => emitter.name === spec);

  if (builtIn) {
    return builtIn;
  }

  const isPath = spec.startsWith('.') || spec.startsWith('/');

  return isPath
    ? loadFromPath(
        { tree, workspaceRoot: paths.workspaceRoot },
        normalise(spec, paths.projectRoot),
      )
    : loadFromPackage(spec, paths.workspaceRoot);
}

function normalise(spec: string, projectRoot: string) {
  const withoutPrefix = spec.replace(/^\.\//, '');
  return spec.startsWith('/') ? spec : `/${projectRoot}/${withoutPrefix}`;
}
