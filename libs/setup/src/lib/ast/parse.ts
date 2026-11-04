import { Tree } from '@angular-devkit/schematics';
import { createSourceFile, ScriptTarget, SourceFile } from 'typescript';

export function loadSourceFile(
  tree: Tree,
  path: string,
): SourceFile | undefined {
  // `readText` drops a BOM, which the positions in an update recorder do not count.
  return tree.exists(path)
    ? createSourceFile(path, tree.readText(path), ScriptTarget.Latest, true)
    : undefined;
}
