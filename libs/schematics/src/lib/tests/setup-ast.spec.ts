import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EmptyTree, SchematicsException } from '@angular-devkit/schematics';
import { logging } from '@angular-devkit/core';
import {
  applyToUpdateRecorder,
  InsertChange,
  NoopChange,
} from '@schematics/angular/utility/change';
import type {
  ProjectDefinition,
  WorkspaceDefinition,
} from '@schematics/angular/utility/workspace';
import {
  addUnionMember,
  appendToLiteral,
  createTreeCompilerHost,
  exportsIdentifier,
  findProvidersProperty,
  findTsConfigPath,
  findVariableWithObjectLiteral,
  findWorkspaceRoot,
  getAngularComponentNaming,
  insertNamedImport,
  isCallee,
  isNamedImported,
  loadAutomationConfig,
  otherProjectDirectories,
  pathUnderRoot,
  readCompilerOptions,
  readSchematicsConfig,
  resolveWithinWorkspace,
  textLayout,
  treePath,
  unwrapToObjectLiteral,
} from '@ngx-formbar/setup';
import {
  createSourceFile,
  factory,
  isArrayLiteralExpression,
  isExpressionStatement,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isVariableStatement,
  ModuleKind,
  Node,
  ScriptTarget,
  SourceFile,
} from 'typescript';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function parse(text: string) {
  return createSourceFile('/f.ts', text, ScriptTarget.Latest, true);
}

function expressionOf(text: string) {
  const statement = parse(`(${text});`).statements[0];

  if (
    !isExpressionStatement(statement) ||
    !isParenthesizedExpression(statement.expression)
  ) {
    throw new Error(`Not an expression: ${text}`);
  }

  return statement.expression.expression;
}

function treeOf(files: Record<string, string>) {
  const tree = new EmptyTree();

  Object.entries(files).forEach(([path, content]) => {
    tree.create(path, content);
  });

  return tree;
}

describe('isCallee', () => {
  it.each([
    ['Component', true],
    ['ng.Component', true],
    ['a.b.Component', true],
    ['Other', false],
    ['Component.other', false],
    ['Component()', false],
    ['ng["Component"]', false],
  ])('for %s is %s', (text, expected) => {
    expect(isCallee(expressionOf(text), 'Component')).toBe(expected);
  });
});

describe('unwrapToObjectLiteral', () => {
  it.each([
    '{ a: 1 }',
    '({ a: 1 })',
    '{ a: 1 } as Config',
    '{ a: 1 } satisfies Config',
    '{ a: 1 }!',
    '(({ a: 1 } as A) satisfies B)!',
    '(() => ({ a: 1 }))()',
  ])('finds the object in %s', (text) => {
    expect(unwrapToObjectLiteral(expressionOf(text))?.getText()).toBe(
      '{ a: 1 }',
    );
  });

  it.each([
    'config',
    '[]',
    'build({ a: 1 })',
    '(function () { return { a: 1 }; })()',
    '(() => { return { a: 1 }; })()',
    '(build)()',
    '(() => (build))()',
    '(() => ([]))()',
  ])('finds nothing in %s', (text) => {
    expect(unwrapToObjectLiteral(expressionOf(text))).toBeNull();
  });
});

describe('findVariableWithObjectLiteral', () => {
  const named =
    (name: string) => (declaration: { name: { getText(): string } }) =>
      declaration.name.getText() === name;

  it('skips what does not hold the object', () => {
    const found = findVariableWithObjectLiteral(
      parse(
        `run();\nlet a;\nconst a = build();\nconst b = 1, a = { first: 1 };\nconst a = { second: 1 };`,
      ),
      named('a'),
    );

    expect(found?.getText()).toBe('{ first: 1 }');
  });

  it('is null without a match', () => {
    expect(
      findVariableWithObjectLiteral(parse('const b = {};'), named('a')),
    ).toBeNull();
  });
});

describe('findProvidersProperty', () => {
  const owner = (text: string) => {
    const object = unwrapToObjectLiteral(expressionOf(text));

    if (!object) {
      throw new Error(`No object: ${text}`);
    }

    return object;
  };

  it.each([
    '{ providers: [] }',
    `{ 'providers': [] }`,
    '{ a: 1, providers: [] }',
  ])('finds it in %s', (text) => {
    expect(findProvidersProperty(owner(text))?.getText()).toMatch(
      /providers'?: \[\]$/,
    );
  });

  it.each([
    '{ other: [] }',
    '{ [providers]: [] }',
    '{ 1: [] }',
    '{ ...providers }',
  ])('finds nothing in %s', (text) => {
    expect(findProvidersProperty(owner(text))).toBeUndefined();
  });
});

describe('exportsIdentifier', () => {
  const inFile = (text: string, others: Record<string, string> = {}) =>
    exportsIdentifier(treeOf({ '/a.ts': text, ...others }), '/a.ts', 'X');

  it.each([
    'export class X {}',
    'export const X = 1;',
    'export function X() {}',
    'export enum X {}',
    'export const Y = 1, X = 2;',
    'class X {}\nexport { X };',
    'class A {}\nclass X {}\nexport { A, X };',
    'class Y {}\nexport { Y as X };',
    `export { X } from 'pkg';`,
    `export * as X from 'pkg';`,
    'export class Y {}\nexport class X {}',
  ])('is true for %s', (text) => {
    expect(inFile(text)).toBe(true);
  });

  it.each([
    'class X {}',
    'export class Y {}',
    'export interface X {}',
    'export type X = 1;',
    'const X = 1;',
    'export const { X } = y;',
    'class X {}\nexport type { X };',
    'class X {}\nexport { type X };',
    'class X {}\nexport { X as Y };',
    `export * as Y from 'pkg';`,
    `export * from 'pkg';`,
    `export * from './none';`,
    `export * from 'b';`,
    `export type * from './b';`,
  ])('is false for %s', (text) => {
    expect(inFile(text, { '/b.ts': 'export class X {}' })).toBe(false);
  });

  it('follows a star export to a file and to an index', () => {
    expect(
      inFile(`export * from './b';`, { '/b.ts': 'export class X {}' }),
    ).toBe(true);
    expect(
      inFile(`export * from './b';`, { '/b/index.ts': 'export class X {}' }),
    ).toBe(true);
  });

  it('stops at a cycle and at a missing file', () => {
    expect(
      inFile(`export * from './b';`, { '/b.ts': `export * from './a';` }),
    ).toBe(false);
    expect(exportsIdentifier(new EmptyTree(), '/a.ts', 'X')).toBe(false);
  });
});

describe('textLayout', () => {
  it.each([
    ['a\n  b', { newLine: '\n', indentUnit: '  ' }],
    ['a\r\n    b', { newLine: '\r\n', indentUnit: '    ' }],
    ['a\n\tb', { newLine: '\n', indentUnit: '\t' }],
    ['a', { newLine: '\n', indentUnit: '  ' }],
    ['/**\n * doc\n */\na\n    b', { newLine: '\n', indentUnit: '    ' }],
    ['a\n   \nb', { newLine: '\n', indentUnit: '  ' }],
  ])('reads %j', (text, expected) => {
    expect(textLayout(text)).toEqual(expected);
  });
});

describe('imports', () => {
  const applied = (text: string) => {
    const change = insertNamedImport(parse(text), '/f.ts', 'X', 'pkg');

    if (change instanceof NoopChange) {
      return text;
    }

    if (!(change instanceof InsertChange)) {
      throw new Error('Unexpected change');
    }

    return `${text.slice(0, change.order)}${change.toAdd}${text.slice(change.order)}`;
  };

  it.each([
    [`import { X } from 'pkg';`, `import { X } from 'pkg';`],
    [`import { A } from 'pkg';`, `import { A, X } from 'pkg';`],
    [`import { A, B } from 'pkg';`, `import { A, B, X } from 'pkg';`],
    [
      `import { A } from 'a';`,
      `import { A } from 'a';\nimport { X } from 'pkg';`,
    ],
    [
      `import { A } from 'a';\nimport { B } from 'b';`,
      `import { A } from 'a';\nimport { B } from 'b';\nimport { X } from 'pkg';`,
    ],
    [
      `import { A } from 'a';\r\nconst b = 1;`,
      `import { A } from 'a';\r\nimport { X } from 'pkg';\r\nconst b = 1;`,
    ],
    [`const a = 1;`, `import { X } from 'pkg';\nconst a = 1;`],
    [`run();`, `import { X } from 'pkg';\nrun();`],
    [``, `import { X } from 'pkg';\n`],
    [`'use strict';`, `'use strict';\nimport { X } from 'pkg';`],
    [
      `import * as all from 'pkg';`,
      `import * as all from 'pkg';\nimport { X } from 'pkg';`,
    ],
    [
      `import type { A } from 'pkg';`,
      `import type { A } from 'pkg';\nimport { X } from 'pkg';`,
    ],
    [`import { type X } from 'pkg';`, `import { type X, X } from 'pkg';`],
    [
      `import type { X } from 'pkg';`,
      `import type { X } from 'pkg';\nimport { X } from 'pkg';`,
    ],
    [`import { Y as X } from 'pkg';`, `import { Y as X } from 'pkg';`],
    [`import { X as Y } from 'pkg';`, `import { X as Y, X } from 'pkg';`],
    [
      `import { A } from 'a';\nimport { B } from 'pkg';\nimport { C } from 'c';`,
      `import { A } from 'a';\nimport { B, X } from 'pkg';\nimport { C } from 'c';`,
    ],
    [`import 'pkg';`, `import 'pkg';\nimport { X } from 'pkg';`],
    [
      `import 'pkg';\nimport D from 'pkg';\nimport * as n from 'pkg';`,
      `import 'pkg';\nimport D from 'pkg';\nimport * as n from 'pkg';\nimport { X } from 'pkg';`,
    ],
    [`import D from 'pkg';`, `import D from 'pkg';\nimport { X } from 'pkg';`],
  ])('adds to %j', (text, expected) => {
    expect(applied(text)).toBe(expected);
  });

  it('tells apart what can be used as a value', () => {
    const imported = (text: string) => isNamedImported(parse(text), 'X', 'pkg');

    expect(imported(`import { X } from 'pkg';`)).toBe(true);
    expect(imported(`import { A, X } from 'pkg';`)).toBe(true);
    expect(imported(`import { X } from 'other';`)).toBe(false);
    expect(imported(`import { type X } from 'pkg';`)).toBe(false);
    expect(imported(`import type { X } from 'pkg';`)).toBe(false);
    expect(imported(`import { X as Y } from 'pkg';`)).toBe(false);
  });
});

describe('appendToLiteral', () => {
  const firstLiteral = (sourceFile: SourceFile) => {
    const initializer = sourceFile.statements
      .filter(isVariableStatement)
      .at(0)
      ?.declarationList.declarations.at(0)?.initializer;

    if (
      !initializer ||
      !(
        isArrayLiteralExpression(initializer) ||
        isObjectLiteralExpression(initializer)
      )
    ) {
      throw new Error('No literal');
    }

    return initializer;
  };

  const applied = (text: string, member: Node) => {
    const tree = treeOf({ '/f.ts': text });
    const sourceFile = parse(text);
    const recorder = tree.beginUpdate('/f.ts');

    applyToUpdateRecorder(
      recorder,
      appendToLiteral(sourceFile, '/f.ts', firstLiteral(sourceFile), [member]),
    );
    tree.commitUpdate(recorder);

    return tree.readText('/f.ts');
  };

  const arrayMember = factory.createArrayLiteralExpression([
    factory.createStringLiteral('k'),
  ]);

  it.each([
    [`const a = [];`, `const a = [\n  ["k"]\n];`],
    [`const a = [1];`, `const a = [1,\n  ["k"]\n];`],
    [`  const a = [];\n`, `  const a = [\n    ["k"]\n  ];\n`],
    [`const a = [\n  1,\n];`, `const a = [\n  1,\n  ["k"],\n];`],
    [`const a = [\n  1\n];`, `const a = [\n  1,\n  ["k"]\n];`],
    [`const a = [\r\n  1,\r\n];`, `const a = [\r\n  1,\r\n  ["k"],\r\n];`],
    [`const a = [\n    1,\n];`, `const a = [\n    1,\n    ["k"],\n];`],
    [`const a = [\n  1, // one\n];`, `const a = [\n  1, // one\n  ["k"],\n];`],
    [`const a = [\n    // none\n];`, `const a = [\n    // none\n    ["k"]\n];`],
    [`const a = [\n];`, `const a = [\n  ["k"]\n];`],
    [`const a = [1, 2];`, `const a = [1, 2,\n  ["k"]\n];`],
    [`const a = [\n  1, 2 ];`, `const a = [\n  1, 2, \n  ["k"]\n];`],
    [`const a = [1,\n2 ];`, `const a = [1,\n2, \n["k"]\n];`],
    [`const a = {};`, `const a = {\n  ["k"]\n};`],
    [
      `// one\r\nconst a = [\n  1,\n];`,
      `// one\r\nconst a = [\n  1,\n  ["k"],\n];`,
    ],
    [
      `function f() {\n  g();\n}\nconst a = [\n      // none\n];`,
      `function f() {\n  g();\n}\nconst a = [\n      // none\n      ["k"]\n];`,
    ],
    [`run();\nconst a = [1];`, `run();\nconst a = [1,\n  ["k"]\n];`],
    [`const a = {\n  b: 1,\n};`, `const a = {\n  b: 1,\n  ["k"],\n};`],
  ])('appends to %j', (text, expected) => {
    expect(applied(text, arrayMember)).toBe(expected);
  });

  it('separates several members', () => {
    const sourceFile = parse(`const a = [\n  1,\n];`);
    const tree = treeOf({ '/f.ts': sourceFile.text });
    const recorder = tree.beginUpdate('/f.ts');

    applyToUpdateRecorder(
      recorder,
      appendToLiteral(sourceFile, '/f.ts', firstLiteral(sourceFile), [
        factory.createNumericLiteral(2),
        factory.createNumericLiteral(3),
      ]),
    );
    tree.commitUpdate(recorder);

    expect(tree.readText('/f.ts')).toBe(`const a = [\n  1,\n  2,\n  3,\n];`);
  });

  it('indents the lines of a printed member by the indent unit of the file', () => {
    const member = factory.createObjectLiteralExpression(
      [factory.createPropertyAssignment('k', factory.createNumericLiteral(1))],
      true,
    );

    expect(applied(`const a = [\n\t1,\n];`, member)).toBe(
      `const a = [\n\t1,\n\t{\n\t\tk: 1\n\t},\n];`,
    );
  });
});

describe('addUnionMember', () => {
  const after = (text: string, typeArgument: string | null = null) => {
    const tree = treeOf({ '/t.ts': text });

    addUnionMember(tree, '/t.ts', 'U', 'M', typeArgument);

    return tree.readText('/t.ts');
  };

  it.each([
    ['type U = never;', 'type U = M;'],
    ['type U = M;', 'type U = M;'],
    ['type U = A;', 'type U = A\n  | M;'],
    ['type U = A | M;', 'type U = A | M;'],
    ['type U =\n  | A\n  | M;', 'type U =\n  | A\n  | M;'],
    ['type U = A | MM;', 'type U = A | MM\n  | M;'],
    [
      'import { M } from "m";\ntype U = A;',
      'import { M } from "m";\ntype U = A\n  | M;',
    ],
    ['type V = M;\ntype U = A;', 'type V = M;\ntype U = A\n  | M;'],
    [
      'const a = 1;\ntype U = A;\nconst b = 2;',
      'const a = 1;\ntype U = A\n  | M;\nconst b = 2;',
    ],
  ])('turns %j into %j', (text, expected) => {
    expect(after(text)).toBe(expected);
  });

  it('keeps the type argument as part of the member', () => {
    expect(after('type U = M;', 'T')).toBe('type U = M\n  | M<T>;');
    expect(after('type U = M<T>;', 'T')).toBe('type U = M<T>;');
  });

  it('throws without the file or the alias', () => {
    expect(() => {
      addUnionMember(new EmptyTree(), '/t.ts', 'U', 'M', null);
    }).toThrow('Type file not found: /t.ts');
    expect(() => {
      addUnionMember(
        treeOf({ '/t.ts': 'type V = 1;' }),
        '/t.ts',
        'U',
        'M',
        null,
      );
    }).toThrow('/t.ts has no type alias named "U".');
    expect(() => {
      addUnionMember(treeOf({ '/t.ts': '' }), '/t.ts', 'U', 'M', null);
    }).toThrow(SchematicsException);
  });
});

describe('paths under the root', () => {
  it.each([
    ['/src/a.ts', '/', '/src/a.ts'],
    ['src/a.ts', '/', '/src/a.ts'],
    ['/src/a.ts', '/work', '/work/src/a.ts'],
    ['src/a.ts', '/work/', '/work/src/a.ts'],
    ['/src/a.ts', 'C:\\work\\app', 'C:/work/app/src/a.ts'],
    ['/src/a.ts', 'C:\\work\\', 'C:/work/src/a.ts'],
  ])('puts %s under %s', (path, root, expected) => {
    expect(pathUnderRoot(path, root)).toBe(expected);
  });

  it.each([
    ['/work/src/a.ts', '/work', '/src/a.ts'],
    ['/work/src/a.ts', '/work/', '/src/a.ts'],
    ['/src/a.ts', '/', '/src/a.ts'],
    ['/work', '/work', '/'],
    ['/other/a.ts', '/work', null],
    ['/workspace/a.ts', '/work', null],
  ])('reads %s back from %s', (fileName, root, expected) => {
    expect(treePath(fileName, root)).toBe(expected);
  });
});

describe('findTsConfigPath', () => {
  const project = (tsConfig?: unknown) =>
    ({
      root: 'p',
      targets: new Map([['build', { options: { tsConfig } }]]),
    }) as unknown as ProjectDefinition;

  it.each([
    [['custom.json', 'p/tsconfig.app.json'], 'custom.json', 'custom.json'],
    [
      ['p/tsconfig.app.json', 'p/tsconfig.lib.json'],
      'none.json',
      'p/tsconfig.app.json',
    ],
    [
      ['p/tsconfig.lib.json', 'p/tsconfig.json'],
      undefined,
      'p/tsconfig.lib.json',
    ],
    [['p/tsconfig.json', 'tsconfig.json'], 1, 'p/tsconfig.json'],
    [['tsconfig.json'], undefined, 'tsconfig.json'],
    [[], undefined, 'tsconfig.base.json'],
  ])('with %j and %j takes %s', (files, configured, expected) => {
    const tree = treeOf(
      Object.fromEntries(files.map((file) => [`/${file}`, '{}'])),
    );

    expect(findTsConfigPath(tree, project(configured))).toBe(expected);
  });

  it('reads a build target without options as no configured path', () => {
    expect(
      findTsConfigPath(treeOf({ '/p/tsconfig.json': '{}' }), {
        root: 'p',
        targets: new Map([['build', {}]]),
      } as unknown as ProjectDefinition),
    ).toBe('p/tsconfig.json');
  });

  it('reads no build target as no configured path', () => {
    expect(
      findTsConfigPath(treeOf({ '/p/tsconfig.json': '{}' }), {
        root: 'p',
        targets: new Map(),
      } as unknown as ProjectDefinition),
    ).toBe('p/tsconfig.json');
  });
});

describe('readCompilerOptions', () => {
  it('has a fallback without a file', () => {
    expect(
      readCompilerOptions(new EmptyTree(), '/tsconfig.json'),
    ).toMatchObject({
      target: ScriptTarget.ES2022,
      module: ModuleKind.ESNext,
      strict: true,
      skipLibCheck: true,
    });
  });

  it('puts the file over the fallback and follows extends in the tree', () => {
    const tree = treeOf({
      '/base.json':
        '{ "compilerOptions": { "strict": false, "baseUrl": "." } }',
      '/tsconfig.json':
        '{ "extends": "./base.json", "compilerOptions": { "target": "ES2020" } }',
    });

    expect(readCompilerOptions(tree, '/tsconfig.json')).toMatchObject({
      strict: false,
      baseUrl: '/',
      target: ScriptTarget.ES2020,
      skipLibCheck: true,
    });
  });

  it('follows extends without the extension', () => {
    const tree = treeOf({
      '/base.json': '{ "compilerOptions": { "strict": false } }',
      '/tsconfig.json': '{ "extends": "./base" }',
    });

    expect(readCompilerOptions(tree, '/tsconfig.json').strict).toBe(false);
  });

  it('roots what the file resolves at the workspace root', () => {
    const tree = treeOf({
      '/tsconfig.json': '{ "compilerOptions": { "baseUrl": "." } }',
    });

    expect(readCompilerOptions(tree, '/tsconfig.json', '/work').baseUrl).toBe(
      '/work',
    );
  });

  it('survives a file that is not JSON', () => {
    expect(
      readCompilerOptions(treeOf({ '/tsconfig.json': '{' }), '/tsconfig.json'),
    ).toMatchObject({ strict: true });
  });
});

describe('createTreeCompilerHost', () => {
  let disk: string;

  beforeEach(() => {
    disk = mkdtempSync(join(tmpdir(), 'setup-host-'));
    writeFileSync(join(disk, 'on-disk.ts'), 'disk');
    mkdirSync(join(disk, 'folder'));
  });

  afterEach(() => {
    rmSync(disk, { recursive: true, force: true });
  });

  it('answers as a case sensitive host with line feeds', () => {
    const host = createTreeCompilerHost(new EmptyTree());

    expect(host.useCaseSensitiveFileNames()).toBe(true);
    expect(host.getNewLine()).toBe('\n');
    expect(host.getCanonicalFileName('/A.ts')).toBe('/A.ts');
    expect(() => {
      host.writeFile('/a.ts', '', false);
    }).not.toThrow();
    expect(host.getDefaultLibFileName({})).toMatch(/lib\.d\.ts$/);
  });

  it.each([
    ['/', '/'],
    ['/work/', '/work'],
    ['C:\\work', 'C:/work'],
  ])('has the current directory of root %s', (workspaceRoot, expected) => {
    expect(
      createTreeCompilerHost(new EmptyTree(), {
        workspaceRoot,
      }).getCurrentDirectory(),
    ).toBe(expected);
  });

  it('reads the tree first and the disk second', () => {
    const inTree = join(disk, 'in-tree.ts');
    const host = createTreeCompilerHost(treeOf({ '/in-tree.ts': 'tree' }), {
      workspaceRoot: disk,
    });

    writeFileSync(inTree, 'shadowed');

    expect(host.readFile(inTree)).toBe('tree');
    expect(host.readFile(join(disk, 'on-disk.ts'))).toBe('disk');
    expect(host.fileExists(inTree)).toBe(true);
    expect(host.fileExists(join(disk, 'on-disk.ts'))).toBe(true);
    expect(host.fileExists(join(disk, 'none.ts'))).toBe(false);
    expect(host.readFile(join(disk, 'none.ts'))).toBeUndefined();
    expect(host.getSourceFile(inTree, ScriptTarget.Latest)?.text).toBe('tree');
    expect(
      host.getSourceFile(join(disk, 'none.ts'), ScriptTarget.Latest),
    ).toBeUndefined();
  });

  it('sets parents on the source files it reads', () => {
    const host = createTreeCompilerHost(treeOf({ '/a.ts': 'const a = 1;' }));
    const file = host.getSourceFile('/a.ts', ScriptTarget.Latest);

    expect(file?.statements[0]?.parent).toBe(file);
  });

  it('keeps to the tree with ownFilesOnly', () => {
    const host = createTreeCompilerHost(
      treeOf({ '/a.ts': 'a', '/node_modules/b/index.ts': 'b' }),
      { ownFilesOnly: true, workspaceRoot: disk },
    );

    expect(host.fileExists(join(disk, 'a.ts'))).toBe(true);
    expect(host.readFile(join(disk, 'a.ts'))).toBe('a');
    expect(host.fileExists(join(disk, 'node_modules/b/index.ts'))).toBe(false);
    expect(host.fileExists(join(disk, 'on-disk.ts'))).toBe(false);
    expect(host.readFile(join(disk, 'on-disk.ts'))).toBeUndefined();
  });

  it('lists directories from the tree and the disk', () => {
    const host = createTreeCompilerHost(
      treeOf({ '/src/a.ts': 'a', '/only/sub/b.ts': 'b', '/on-disk.ts': 'x' }),
      { workspaceRoot: disk },
    );

    expect(host.directoryExists?.(join(disk, 'src'))).toBe(true);
    expect(host.directoryExists?.(join(disk, 'only'))).toBe(true);
    expect(host.directoryExists?.(join(disk, 'folder'))).toBe(true);
    expect(host.directoryExists?.(join(disk, 'none'))).toBe(false);
    expect(host.directoryExists?.(join(disk, 'on-disk.ts'))).toBe(false);
    expect(host.directoryExists?.(join(disk, 'src/a.ts'))).toBe(false);
    expect(host.directoryExists?.(join(disk, 'src/a.ts/below'))).toBe(false);
    expect(host.directoryExists?.('/elsewhere-above')).toBe(false);
    expect(host.getDirectories?.(disk).sort()).toEqual([
      'folder',
      'only',
      'src',
    ]);
    expect(host.getDirectories?.(join(disk, 'only'))).toEqual(['sub']);
    expect(host.getDirectories?.(join(disk, 'none'))).toEqual([]);
    expect(host.getDirectories?.(join(disk, 'src/a.ts'))).toEqual([]);
  });
});

describe('findWorkspaceRoot', () => {
  let disk: string;

  beforeEach(() => {
    disk = mkdtempSync(join(tmpdir(), 'setup-root-'));
    mkdirSync(join(disk, 'a/b'), { recursive: true });
  });

  afterEach(() => {
    rmSync(disk, { recursive: true, force: true });
  });

  it.each(['angular.json', '.angular.json'])('walks up to %s', (file) => {
    writeFileSync(join(disk, file), '{}');

    expect(findWorkspaceRoot(join(disk, 'a/b'))).toBe(disk);
    expect(findWorkspaceRoot(disk)).toBe(disk);
  });

  it('takes the nearest', () => {
    writeFileSync(join(disk, 'angular.json'), '{}');
    writeFileSync(join(disk, 'a/angular.json'), '{}');

    expect(findWorkspaceRoot(join(disk, 'a/b'))).toBe(join(disk, 'a'));
  });

  it('is the cwd without a workspace file', () => {
    expect(findWorkspaceRoot(join(disk, 'a/b'))).toBe(join(disk, 'a/b'));
  });
});

describe('readSchematicsConfig', () => {
  const SHARED = '/formbar-schematic.config.json';
  const OWN = '/src/app/formbar-schematic.config.json';

  it.each([
    [
      { a: 1, b: 2 },
      { b: 3, c: 4 },
      { a: 1, b: 3, c: 4 },
    ],
    [{ a: { x: 1, y: 2 } }, { a: { y: 3 } }, { a: { x: 1, y: 3 } }],
    [{ a: 1 }, { a: { x: 1 } }, { a: { x: 1 } }],
    [{ a: { x: 1 } }, { a: 1 }, { a: 1 }],
    [{ a: 1, b: 2 }, { a: null }, { b: 2 }],
    [{ a: { x: 1, y: 2 } }, { a: { x: null } }, { a: { y: 2 } }],
    [{ a: [1] }, { a: [2] }, { a: [2] }],
  ])('merges %j and %j', (shared, own, expected) => {
    const tree = treeOf({
      [SHARED]: JSON.stringify(shared),
      [OWN]: JSON.stringify(own),
    });

    expect(readSchematicsConfig(tree, OWN)).toEqual(expected);
  });

  it('reads either file alone, the shared file once, and nothing at all', () => {
    expect(readSchematicsConfig(treeOf({ [OWN]: '{"a":1}' }), OWN)).toEqual({
      a: 1,
    });
    expect(readSchematicsConfig(treeOf({ [SHARED]: '{"a":1}' }), null)).toEqual(
      { a: 1 },
    );
    expect(
      readSchematicsConfig(treeOf({ [SHARED]: '{"a":{"b":null}}' }), SHARED),
    ).toEqual({ a: { b: null } });
    expect(readSchematicsConfig(new EmptyTree(), OWN)).toBeNull();
    expect(readSchematicsConfig(new EmptyTree(), null)).toBeNull();
  });

  it('reads a file with a BOM', () => {
    expect(
      readSchematicsConfig(treeOf({ [OWN]: '\uFEFF{"a":1}' }), OWN),
    ).toEqual({
      a: 1,
    });
  });

  it('logs which files it read', () => {
    const messages: string[] = [];
    const logger = new logging.Logger('test');

    logger.subscribe(({ message }) => messages.push(message));

    loadAutomationConfig(
      treeOf({
        [SHARED]: '{}',
        '/src/app/formbar-schematic.config.json': '{}',
      }),
      'src',
      logger,
    );
    loadAutomationConfig(treeOf({ [SHARED]: '{}' }), 'src', logger);
    loadAutomationConfig(new EmptyTree(), 'src', logger);

    expect(messages).toEqual([
      `Using schematics configuration file ${OWN} over ${SHARED}`,
      `Using schematics configuration file ${SHARED}`,
      `No schematics configuration file found. Looked for ${OWN} and ${SHARED}`,
    ]);
  });
});

describe('resolveWithinWorkspace', () => {
  it.each([
    ['a.ts', 'src', '/src/a.ts'],
    ['./a.ts', 'src', '/src/a.ts'],
    ['././a.ts', 'src', '/src/a.ts'],
    ['.//a.ts', 'src', '/src/a.ts'],
    ['/a.ts', 'src', '/a.ts'],
    ['src/a.ts', 'src', '/src/a.ts'],
    ['././src/a.ts', 'src', '/src/a.ts'],
    ['x/./a.ts', 'src', '/src/x/a.ts'],
    ['../../a.ts', 'src', null],
  ])('resolves %s in %s', (path, sourceRoot, expected) => {
    expect(resolveWithinWorkspace(path, sourceRoot)).toBe(expected);
  });
});

describe('project helpers', () => {
  const definition = (
    root: string,
    sourceRoot?: string,
    extensions: Record<string, unknown> = {},
  ) => ({ root, sourceRoot, extensions }) as unknown as ProjectDefinition;

  it('lists the directories of other projects', () => {
    const own = definition('apps/a', 'apps/a/src');
    const workspace = {
      projects: new Map([
        ['a', own],
        ['b', definition('libs/b', 'libs/b/src')],
        ['c', definition('libs/c')],
        ['root', definition('')],
        ['nested', definition('apps/a/nested')],
      ]),
    } as unknown as WorkspaceDefinition;

    expect(otherProjectDirectories(own, workspace)).toEqual([
      'libs/b',
      'libs/b/src',
      'libs/c',
      'libs/c',
      'apps/a/nested',
      'apps/a/nested',
    ]);
  });

  const SCHEMATIC = '@schematics/angular:component';

  it.each([
    [undefined, undefined, { type: '', addTypeToClassName: true }],
    ['text', undefined, { type: '', addTypeToClassName: true }],
    [
      { [SCHEMATIC]: 'text' },
      undefined,
      { type: '', addTypeToClassName: true },
    ],
    [
      { [SCHEMATIC]: { type: 'component', addTypeToClassName: false } },
      undefined,
      { type: 'component', addTypeToClassName: false },
    ],
    [
      { [SCHEMATIC]: { type: 'a', addTypeToClassName: false } },
      { [SCHEMATIC]: { type: 'b' } },
      { type: 'b', addTypeToClassName: false },
    ],
    [
      { [SCHEMATIC]: { type: 1, addTypeToClassName: 'no' } },
      undefined,
      { type: '', addTypeToClassName: true },
    ],
  ])('names components with %j over %j', (inWorkspace, inProject, expected) => {
    expect(
      getAngularComponentNaming(
        {
          extensions: { schematics: inWorkspace },
        } as unknown as WorkspaceDefinition,
        definition('a', undefined, { schematics: inProject }),
      ),
    ).toEqual(expected);
  });
});
