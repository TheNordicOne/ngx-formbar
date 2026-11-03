import { normalize } from '@angular-devkit/core';
import { SchematicsException } from '@angular-devkit/schematics';

/**
 * Turns a path out of the schema config (`schema.type`, an entry's `output`, or
 * a `use` pointing at a file) into a Tree path. Such paths are relative to the
 * source root, and a leading `/` means the workspace root. Resolving here rather
 * than in each emitter keeps every emitter, ours and a consumer's, from having
 * to know the convention. `null` marks a path above the workspace root, the only
 * input `normalize` rejects.
 */
export function resolveProjectPath(
  path: string,
  projectRoot: string,
): string | null {
  try {
    return normalize(path.startsWith('/') ? path : `/${projectRoot}/${path}`);
  } catch {
    return null;
  }
}

/** `resolveProjectPath` for a path the run cannot do without. */
export function resolveRequiredProjectPath(
  option: string,
  path: string,
  projectRoot: string,
): string {
  const resolved = resolveProjectPath(path, projectRoot);

  if (!resolved) {
    throw new SchematicsException(
      `"${option}" points outside the workspace root: ${path}`,
    );
  }

  return resolved;
}
