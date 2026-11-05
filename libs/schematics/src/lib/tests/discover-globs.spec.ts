import { HostTree } from '@angular-devkit/schematics';
import { describe, expect, it } from 'vitest';
import { findPotentialControlComponents } from '../register/discover-components';

const sourceRoot = 'projects/app/src';
const root = `/${sourceRoot}`;

function found(files: string[], include: string[], exclude: string[] = []) {
  const tree = new HostTree();
  files.forEach((file) => {
    tree.create(`${root}/${file}`, '');
  });

  return findPotentialControlComponents(
    tree,
    { sourceRoot, otherProjectDirectories: [] },
    include,
    exclude,
  ).map((path) => path.slice(root.length + 1));
}

describe('discovery globs', () => {
  it.each([
    ['* stays in its segment', 'app/*.ts', ['app/a.ts'], ['app/b/a.ts']],
    ['** crosses segments', 'app/**.ts', ['app/a.ts', 'app/b/a.ts'], []],
    ['***  is the same as **', 'app/***.ts', ['app/a.ts', 'app/b/a.ts'], []],
    ['**/ may match nothing', 'app/**/a.ts', ['app/a.ts', 'app/b/c/a.ts'], []],
    [
      '** inside a segment is no whole segment',
      'app**/a.ts',
      ['appx/a.ts', 'app/b/a.ts'],
      ['appa.ts'],
    ],
    ['? is one character', 'app/?.ts', ['app/a.ts'], ['app/ab.ts', 'app/.ts']],
    ['? stays in its segment', 'app?a.ts', [], ['app/a.ts']],
    ['[] is a class', 'app/[ab].ts', ['app/a.ts', 'app/b.ts'], ['app/c.ts']],
    ['[] takes a range', 'app/[a-c]d.ts', ['app/bd.ts'], ['app/ed.ts']],
    [
      'a negated class stays in its segment',
      'x[^a]y.ts',
      ['xby.ts'],
      ['x/y.ts'],
    ],
    ['a range stays in its segment', 'x[.-0]y.ts', ['x.y.ts'], ['x/y.ts']],
    ['an open [ is a character', 'app/[a.ts', ['app/[a.ts'], ['app/a.ts']],
    ['[ with a separator is a character', '[a/b].ts', ['[a/b].ts'], ['a.ts']],
    ['. is a character', 'app/a.ts', ['app/a.ts'], ['app/axts']],
    ['+ is a character', 'a+.ts', ['a+.ts'], ['aa.ts']],
    ['^ is a character', 'a^b.ts', ['a^b.ts'], []],
    ['$ is a character', 'a$b.ts', ['a$b.ts'], []],
    ['{} are characters', 'a{2}.ts', ['a{2}.ts'], ['aa.ts']],
    ['() are characters', '(a).ts', ['(a).ts'], ['a.ts']],
    ['| is a character', 'a|b.ts', ['a|b.ts'], ['a', 'b.ts']],
  ])('%s', (_, glob, matching, others) => {
    expect(found([...matching, ...others], [glob]).sort()).toEqual(
      [...matching].sort(),
    );
  });

  it('matches the whole path from the workspace root', () => {
    expect(found(['app/a.ts'], ['**/*.ts'], ['/app/**'])).toEqual(['app/a.ts']);
  });

  it('gives the files sorted', () => {
    expect(found(['b.ts', 'a/x.ts'], ['**/*.ts'])).toEqual(['a/x.ts', 'b.ts']);
  });

  it('finds nothing without an include', () => {
    expect(found(['a.ts'], [])).toEqual([]);
  });

  describe('a glob that cannot work', () => {
    it.each([[''], ['  ']])('fails on the empty include %j', (glob) => {
      expect(() => found([], [glob])).toThrow(
        'Empty include glob pattern is not allowed.',
      );
    });

    it('names the option of an empty exclude', () => {
      expect(() => found([], ['**'], [''])).toThrow(
        'Empty exclude glob pattern is not allowed.',
      );
    });

    it('fails on an invalid class in an include', () => {
      expect(() => found([], ['[z-a].ts'])).toThrow(
        'Invalid include glob "[z-a].ts".',
      );
    });

    it('fails on an invalid class in an exclude', () => {
      expect(() => found([], ['**'], ['[z-a].ts'])).toThrow(
        'Invalid exclude glob "[z-a].ts".',
      );
    });

    it('names exclude when one leaves the workspace', () => {
      expect(() => found([], ['**'], ['../../../../x'])).toThrow(
        '"exclude" points outside the workspace root',
      );
    });
  });

  describe('an include from the workspace root', () => {
    it('accepts a glob starting above the source root', () => {
      expect(found(['a.ts'], ['/projects/**/*.ts'])).toEqual(['a.ts']);
    });

    it('accepts a folder above the source root', () => {
      expect(found(['a.ts'], ['/projects/app'])).toEqual(['a.ts']);
    });

    it('fails on a file next to the source root', () => {
      expect(() => found([], ['/projects/app/other.ts'])).toThrow(
        `"include" points outside the source root ${sourceRoot}`,
      );
    });
  });
});
