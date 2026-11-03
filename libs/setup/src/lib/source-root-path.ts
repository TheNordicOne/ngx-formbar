import { normalize } from '@angular-devkit/core';
import { SchematicsException } from '@angular-devkit/schematics';
import { posix } from 'node:path';

/**
 * A leading `/` makes `path` workspace-absolute. Otherwise it is relative to
 * the source root, unless it already lies inside it. A leading `./` is
 * ignored.
 */
export function resolveFromSourceRoot(
  path: string,
  sourceRoot: string,
): string {
  const relative = path.replace(/^(?:\.\/+)+/, '');
  const prefix =
    relative.startsWith('/') || isWithin(relative, sourceRoot)
      ? ''
      : `/${sourceRoot}`;

  return normalize(`${prefix}/${relative}`);
}

/**
 * For a path known to be relative to the source root, such as a default. It
 * never counts as already inside the source root, unlike a supplied path.
 */
export function joinToSourceRoot(path: string, sourceRoot: string): string {
  return normalize(`/${sourceRoot}/${path}`);
}

/**
 * The config value that `resolveFromSourceRoot` reads back as `absolute`: the
 * path relative to the source root where that reads back, otherwise `absolute`.
 * The source root itself has no relative form, as an empty value counts as unset.
 */
export function sourceRootValue(absolute: string, sourceRoot: string): string {
  const relative = posix.relative(`/${sourceRoot}`, absolute);

  return relative &&
    !relative.startsWith('..') &&
    resolveFromSourceRoot(relative, sourceRoot) === absolute
    ? relative
    : absolute;
}

/**
 * `resolveFromSourceRoot`, with `null` for a path that climbs above the workspace
 * root. That is the only input `normalize` rejects.
 */
export function resolveWithinWorkspace(
  path: string,
  sourceRoot: string,
): string | null {
  try {
    return resolveFromSourceRoot(path, sourceRoot);
  } catch {
    return null;
  }
}

/** `resolveWithinWorkspace` for a path a schematic cannot do without. */
export function resolveRequiredPath(
  option: string,
  path: string,
  sourceRoot: string,
): string {
  const resolved = resolveWithinWorkspace(path, sourceRoot);

  if (!resolved) {
    throw new SchematicsException(
      `"${option}" points outside the workspace root: ${path}`,
    );
  }

  return resolved;
}

/**
 * Compares whole segments, so `srcShared` does not lie within `src`. `root` may
 * be spelled as in `angular.json`, such as `src/` or `./src`.
 */
export function isWithin(path: string, root: string): boolean {
  const normalizedRoot = normalize(`/${root}`).slice(1);

  return (
    normalizedRoot === '' ||
    path === normalizedRoot ||
    path.startsWith(`${normalizedRoot}/`)
  );
}
