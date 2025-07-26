import { Tree } from '@angular-devkit/schematics';

export function findConfigPath(tree: Tree, sourceRoot: string): string | null {
  const candidates = [
    `/${sourceRoot}/formwork.config.ts`,
    `/${sourceRoot}/app.config.ts`,
  ];
  return candidates.find((p) => tree.exists(p)) ?? null;
}
