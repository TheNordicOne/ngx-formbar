import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { Project } from 'ts-morph';

export function findConfigPath(tree: Tree, sourceRoot: string): string | null {
  const candidates = [
    `/${sourceRoot}/formwork.config.ts`,
    `/${sourceRoot}/app.config.ts`,
  ];
  return candidates.find((p) => tree.exists(p)) ?? null;
}

export function getSourceFile(tree: Tree, path: string) {
  const buffer = tree.read(path);
  if (!buffer) {
    throw new SchematicsException(`File not found: ${path}`);
  }
  const text = buffer.toString('utf-8');
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: { allowJs: true },
  });
  return project.createSourceFile(path, text, { overwrite: true });
}
