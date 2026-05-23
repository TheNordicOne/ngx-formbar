import { Tree } from '@angular-devkit/schematics';
import { createSourceFile, ScriptTarget, SourceFile } from 'typescript';

export function loadSourceFile(
  tree: Tree,
  path: string,
): SourceFile | undefined {
  const buffer = tree.read(path);
  if (!buffer) {
    return undefined;
  }

  const content = buffer.toString('utf-8');
  return createSourceFile(path, content, ScriptTarget.Latest, true);
}

export function parseTS(code: string): SourceFile {
  return createSourceFile('temp.ts', code, ScriptTarget.Latest, true);
}
