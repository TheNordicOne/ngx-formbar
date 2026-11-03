import { Tree } from '@angular-devkit/schematics';
import { Emitter, EmitPaths } from './define-emitter';
import { loadFromPackage, loadFromPath } from './load';
import { draft07Emitter, draft202012Emitter } from './json-schema/dialects';
import { joinToSourceRoot, resolveRequiredPath } from '@ngx-formbar/setup';

const BUILT_INS = [draft202012Emitter, draft07Emitter];

function findBuiltIn(spec: string) {
  return BUILT_INS.find((emitter) => emitter.name === spec);
}

export function builtInDefaultOutput(
  spec: string,
  projectRoot: string,
): string | null {
  const builtIn = findBuiltIn(spec);

  return builtIn ? joinToSourceRoot(builtIn.defaultOutput, projectRoot) : null;
}

export function resolveEmitter(
  spec: string,
  tree: Tree,
  paths: EmitPaths,
): Emitter {
  const isPath = spec.startsWith('.') || spec.startsWith('/');

  return (
    findBuiltIn(spec) ??
    (isPath
      ? loadFromPath(
          { tree, workspaceRoot: paths.workspaceRoot },
          resolveRequiredPath('use', spec, paths.projectRoot),
        )
      : loadFromPackage(spec, paths.workspaceRoot))
  );
}
