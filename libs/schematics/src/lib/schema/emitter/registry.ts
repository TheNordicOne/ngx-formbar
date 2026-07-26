import { Tree } from '@angular-devkit/schematics';
import { Emitter, EmitPaths } from './define-emitter';
import { loadFromPackage, loadFromPath } from './load';
import { draft07Emitter, draft202012Emitter } from './json-schema/dialects';

const BUILT_INS: Emitter[] = [draft202012Emitter, draft07Emitter];

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
