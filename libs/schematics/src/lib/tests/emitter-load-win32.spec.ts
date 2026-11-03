import { describe, expect, it, vi } from 'vitest';
import { Tree } from '@angular-devkit/schematics';
import { loadFromPath } from '../schema/emitter/load';

/**
 * Tree paths are virtual and '/'-rooted on every platform, so the loader must never
 * walk them with the platform-native path API. Substituting win32 for `node:path` is
 * the only way a POSIX machine can observe that. `resolve` is anchored explicitly
 * because it takes its drive from the working directory, which on Windows always has
 * one and on the machine running this test never does.
 */
vi.mock('node:path', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:path')>();
  return {
    ...actual.win32,
    resolve: (...segments: string[]) =>
      actual.win32.resolve('C:\\workspace', ...segments),
    default: actual.win32,
  };
});

describe('loadFromPath on a win32 host', () => {
  it('resolves a relative import against the Tree', () => {
    const tree = Tree.empty();
    tree.create(
      '/projects/app/src/tools/render.ts',
      `export function render() {
  return 'rendered';
}
`,
    );
    tree.create(
      '/projects/app/src/tools/win-emitter.ts',
      `import { defineEmitter } from '@ngx-formbar/schematics';
import { render } from './render';

export default defineEmitter({ name: render(), emit() {} });
`,
    );

    const emitter = loadFromPath(
      { tree, workspaceRoot: 'C:\\workspace' },
      '/projects/app/src/tools/win-emitter.ts',
    );

    expect(emitter.name).toBe('rendered');
  });
});
