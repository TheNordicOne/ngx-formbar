import { Tree } from '@angular-devkit/schematics';
import { createSourceFile, ScriptTarget } from 'typescript';

export function loadSourceFile(tree: Tree, path: string) {
  const buffer = tree.read(path);
  if (!buffer) {
    return undefined;
  }

  const content = buffer.toString('utf-8');
  return createSourceFile(path, content, ScriptTarget.Latest, true);
}

export function parseTS(code: string) {
  return createSourceFile('temp.ts', code, ScriptTarget.Latest, true);
}
