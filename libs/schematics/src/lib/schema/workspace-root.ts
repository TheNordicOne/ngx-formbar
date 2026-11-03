import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const WORKSPACE_FILES = ['angular.json', '.angular.json'];

/**
 * The Angular CLI roots the Tree at the nearest directory above the cwd that
 * holds a workspace file, and it never changes directory. `ng generate` run
 * from a subdirectory therefore leaves the cwd below the Tree root, so the same
 * lookup recovers it. Without a workspace file the cwd is the root.
 */
export function findWorkspaceRoot(cwd: string): string {
  let directory = cwd;

  while (!holdsWorkspaceFile(directory)) {
    const parent = dirname(directory);

    if (parent === directory) {
      return cwd;
    }

    directory = parent;
  }

  return directory;
}

function holdsWorkspaceFile(directory: string) {
  return WORKSPACE_FILES.some((name) => existsSync(join(directory, name)));
}
