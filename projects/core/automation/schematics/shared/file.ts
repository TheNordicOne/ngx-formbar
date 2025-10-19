import { SchematicsException, Tree } from '@angular-devkit/schematics';

export function findConfigPath(tree: Tree, sourceRoot: string): string | null {
  const candidates = [
    `/${sourceRoot}/formwork.config.ts`,
    `/${sourceRoot}/app.config.ts`,
  ];
  return candidates.find((p) => tree.exists(p)) ?? null;
}

export function readFile<T>(tree: Tree, path?: string): T | null {
  if (!path) {
    return null;
  }
  const buf = tree.read(path);
  if (!buf) {
    throw new SchematicsException(`Could not read ${path}`);
  }

  const text = buf.toString('utf-8');

  return JSON.parse(text) as T;
}
