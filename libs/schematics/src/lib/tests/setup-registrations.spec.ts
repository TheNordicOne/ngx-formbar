import { describe, expect, it } from 'vitest';
import { EmptyTree } from '@angular-devkit/schematics';
import {
  componentRegistrationsObjectHasKey,
  componentRegistrationsObjectUsesComponent,
  findComponentRegistrationsNode,
  findComponentRegistrationsObject,
  findMapArrayLiteral,
  registrationNodeHasKey,
  registrationNodeUsesComponent,
} from '@ngx-formbar/setup';
import {
  createSourceFile,
  isExpressionStatement,
  isParenthesizedExpression,
  ScriptTarget,
} from 'typescript';

function parse(text: string) {
  return createSourceFile('/src/reg.ts', text, ScriptTarget.Latest, true);
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

const TOKEN = 'NGX_FW_COMPONENT_REGISTRATIONS';

describe('findComponentRegistrationsNode', () => {
  it.each([
    `const p = { provide: ${TOKEN}, useValue: new Map([]) };`,
    `const p = { 'provide': ${TOKEN}, 'useValue': new Map([]) };`,
    `const p = [[{ provide: ${TOKEN}, useValue: new Map([]) }]];`,
    `function f() { return { useValue: new Map([]), provide: ${TOKEN} }; }`,
  ])('finds the map in %s', (text) => {
    expect(findComponentRegistrationsNode(parse(text))?.getText()).toBe(
      'new Map([])',
    );
  });

  it.each([
    'const p = new Map([]);',
    'const p = { useValue: new Map([]) };',
    `const p = { provide: OTHER, useValue: new Map([]) };`,
    `const p = { provide: '${TOKEN}', useValue: new Map([]) };`,
    `const p = { other: ${TOKEN}, useValue: new Map([]) };`,
    `const p = { provide: ${TOKEN}, useFactory: new Map([]) };`,
    `const p = { provide: ${TOKEN}, [useValue]: new Map([]) };`,
    `const p = { provide: ${TOKEN}, useValue: new Set([]) };`,
    `const p = { provide: ${TOKEN}, useValue: new x.Map([]) };`,
    `const p = { provide: ${TOKEN}, useValue: [] };`,
    `const p = f(new Map([]));`,
  ])('finds nothing in %s', (text) => {
    expect(findComponentRegistrationsNode(parse(text))).toBeNull();
  });

  it('takes the first of several', () => {
    const entry = (key: string) =>
      `{ provide: ${TOKEN}, useValue: new Map([['${key}', A]]) }`;

    expect(
      findComponentRegistrationsNode(
        parse(`const p = [${entry('first')}, ${entry('second')}];`),
      )?.getText(),
    ).toContain('first');
  });
});

describe('findMapArrayLiteral', () => {
  it('returns the entries of a map', () => {
    expect(
      findMapArrayLiteral(expressionOf('new Map([[1, 2]])'))?.getText(),
    ).toBe('[[1, 2]]');
  });

  it.each(['new Map()', 'new Map', 'new Map(entries)', '[[1, 2]]', 'Map([])'])(
    'has none for %s',
    (text) => {
      expect(findMapArrayLiteral(expressionOf(text))).toBeNull();
    },
  );
});

describe('registrationNodeHasKey', () => {
  it.each([
    [`new Map([['a', A]])`, true],
    [`new Map([['z', Z], ['a', A]])`, true],
    [`new Map([['b', A]])`, false],
    [`new Map([['a']])`, false],
    [`new Map([['a', A, B]])`, false],
    [`new Map([[a, A]])`, false],
    [`new Map([row])`, false],
    [`new Map()`, false],
    [`{ a: A }`, false],
  ])('for %s is %s', (text, expected) => {
    expect(registrationNodeHasKey(expressionOf(text), 'a')).toBe(expected);
  });
});

describe('findComponentRegistrationsObject', () => {
  const found = '{ a: A }';

  it.each([
    `const componentRegistrations = ${found};`,
    `const componentsRegistrations = ${found};`,
    `const other = 1, componentRegistrations = ${found};`,
    `const formbarConfig = defineFormbarConfig({ componentRegistrations: ${found} });`,
    `const other = 1, formbarConfig = defineFormbarConfig({ componentRegistrations: ${found} });`,
    `const formbarConfig = defineFormbarConfig({ 'componentRegistrations': ${found} });`,
    `const appConfig = { providers: [provideFormbar({ componentRegistrations: ${found} })] };`,
    `const appConfig = { providers: [other(), provideFormbar({ componentRegistrations: ${found} })] };`,
    `const other = 1, appConfig = { providers: [provideFormbar({ componentRegistrations: ${found} })] };`,
    `function f() { const componentRegistrations = ${found}; }`,
  ])('finds the object in %s', (text) => {
    expect(findComponentRegistrationsObject(parse(text))?.getText()).toBe(
      found,
    );
  });

  it.each([
    'const other = { a: A };',
    'const componentRegistrations = build();',
    'let componentRegistrations;',
    'const { componentRegistrations } = source;',
    'componentRegistrations = { a: A };',
    'const formbarConfig = { componentRegistrations: { a: A } };',
    'const formbarConfig = defineFormbarConfig();',
    'const formbarConfig = defineFormbarConfig(config);',
    'const formbarConfig = other({ componentRegistrations: { a: A } });',
    'const formbarConfig = x.defineFormbarConfig({ componentRegistrations: { a: A } });',
    'const formbarConfig = defineFormbarConfig({ other: { a: A } });',
    'const formbarConfig = defineFormbarConfig({ componentRegistrations });',
    'const formbarConfig = defineFormbarConfig({ componentRegistrations: build() });',
    'const other = defineFormbarConfig({ componentRegistrations: { a: A } });',
    'let formbarConfig;',
    'const appConfig = { providers: [provideFormbar()] };',
    'const appConfig = { providers: [other({ componentRegistrations: { a: A } })] };',
    'const appConfig = { providers: [x.provideFormbar({ componentRegistrations: { a: A } })] };',
    'const appConfig = { providers: [row] };',
    'const appConfig = { providers: list };',
    'const appConfig = { other: [provideFormbar({ componentRegistrations: { a: A } })] };',
    'provideFormbar({ componentRegistrations: { a: A } });',
  ])('finds nothing in %s', (text) => {
    expect(findComponentRegistrationsObject(parse(text))).toBeNull();
  });
});

describe('componentRegistrationsObjectHasKey', () => {
  const object = (text: string) => {
    const found = findComponentRegistrationsObject(
      parse(`const componentRegistrations = ${text};`),
    );

    if (!found) {
      throw new Error(`Not found: ${text}`);
    }

    return found;
  };

  it.each([
    [`{ a: A }`, true],
    [`{ 'a': A }`, true],
    [`{ z: Z, a: A }`, true],
    [`{ b: A }`, false],
    [`{ a }`, false],
    [`{ a() {} }`, false],
    [`{ ...a }`, false],
    [`{ [a]: A }`, false],
    [`{}`, false],
  ])('for %s is %s', (text, expected) => {
    expect(componentRegistrationsObjectHasKey(object(text), 'a')).toBe(
      expected,
    );
  });
});

describe('finding the registered component', () => {
  const DECLARATION = 'export class Comp {}';

  function treeOf(files: Record<string, string>) {
    const tree = new EmptyTree();

    Object.entries(files).forEach(([path, content]) => {
      tree.create(path, content);
    });

    return tree;
  }

  function usesIt(
    registrations: string,
    value: string,
    files: Record<string, string> = { '/src/comp.ts': DECLARATION },
    filePath = '/src/comp.ts',
  ) {
    const asMap = expressionOfFile(
      `${registrations}\nconst p = { provide: ${TOKEN}, useValue: new Map([['k', ${value}]]) };`,
    );
    const asObject = findComponentRegistrationsObject(
      parse(
        `${registrations}\nconst componentRegistrations = { k: ${value} };`,
      ),
    );
    const query = {
      tree: treeOf(files),
      tsConfigPath: '/tsconfig.json',
      className: 'Comp',
      filePath,
    };

    if (!asObject) {
      throw new Error('Registrations not found');
    }

    const viaMap = registrationNodeUsesComponent(asMap, query);

    expect(componentRegistrationsObjectUsesComponent(asObject, query)).toBe(
      viaMap,
    );

    return viaMap;
  }

  function expressionOfFile(text: string) {
    const found = findComponentRegistrationsNode(parse(text));

    if (!found) {
      throw new Error('Map not found');
    }

    return found;
  }

  const imported = `import { Comp } from './comp';`;

  it.each([
    [imported, 'Comp'],
    [`import { Comp as Renamed } from './comp';`, 'Renamed'],
    [`import { Other, Comp } from './comp';`, 'Comp'],
    [imported, 'staticComponent(Comp)'],
    ['', `loadComponent(() => import('./comp').then((m) => m.Comp))`],
    ['', `loadComponent(() => import('./comp').then(({ Comp }) => Comp))`],
    ['', `loadComponent(() => import('./comp').then(({ Comp: C }) => C))`],
    ['', `loadComponent(async () => (await import('./comp')).Comp)`],
    ['', `() => import('./comp').then((m) => m.Comp)`],
    [imported, '{ component: Comp }'],
    ['', `{ loadComponent: () => import('./comp').then((m) => m.Comp) }`],
    [
      '',
      `{ other: 1, loadComponent: () => import('./comp').then((m) => m.Comp) }`,
    ],
  ])('recognizes %s with %s', (registrations, value) => {
    expect(usesIt(registrations, value)).toBe(true);
  });

  it.each([
    ['', 'Comp'],
    [imported, 'Other'],
    [`import { Other as Comp } from './comp';`, 'Comp'],
    [`import * as Comp from './comp';`, 'Comp'],
    [`import Comp from './comp';`, 'Comp'],
    [`import { Comp } from './other';`, 'Comp'],
    [imported, 'wrap(Comp)'],
    [imported, 'x.staticComponent(Comp)'],
    [imported, 'staticComponent()'],
    [imported, '{ other: Comp }'],
    [imported, '{ component }'],
    [imported, '{}'],
    [imported, 'Comp.x'],
    [imported, `'Comp'`],
    ['', `loadComponent(() => import('./comp').then((m) => m.Other))`],
    ['', `loadComponent(() => import('./other').then((m) => m.Comp))`],
    ['', `loadComponent(() => import('./comp').then(({ Other }) => Other))`],
    ['', `loadComponent(() => import('./comp').then(({ Comp }) => Other))`],
    ['', `loadComponent(() => import('./comp').then(([Comp]) => Comp))`],
    ['', `loadComponent(() => import('./comp').then((Comp) => Comp))`],
    ['', `loadComponent(() => import('./comp').then(cb))`],
    ['', `loadComponent(() => import('./comp').then())`],
    ['', `loadComponent(() => load('./comp').then((m) => m.Comp))`],
    ['', `loadComponent(() => import('./comp').catch((m) => m.Comp))`],
    ['', `loadComponent(() => import(path).then((m) => m.Comp))`],
    ['', `loadComponent(() => load.then((m) => m.Comp))`],
    ['', `loadComponent(async () => (await import('./comp')).Other)`],
    ['', `loadComponent(async () => (await load('./comp')).Comp)`],
    ['', `loadComponent(async () => (await source).Comp)`],
    ['', `loadComponent(async () => (import('./comp')).Comp)`],
    ['', `loadComponent(async () => source.Comp)`],
    ['', `loadComponent(loader)`],
  ])('does not recognize %s with %s', (registrations, value) => {
    expect(usesIt(registrations, value)).toBe(false);
  });

  it('skips map entries of another shape', () => {
    const query = {
      tree: treeOf({ '/src/comp.ts': DECLARATION }),
      tsConfigPath: '/tsconfig.json',
      className: 'Comp',
      filePath: '/src/comp.ts',
    };
    const map = (entries: string) =>
      expressionOfFile(
        `${imported}\nconst p = { provide: ${TOKEN}, useValue: new Map(${entries}) };`,
      );

    expect(registrationNodeUsesComponent(map(`[row]`), query)).toBe(false);
    expect(registrationNodeUsesComponent(map(`[['k']]`), query)).toBe(false);
    expect(registrationNodeUsesComponent(map(`[['k', A, Comp]]`), query)).toBe(
      false,
    );
    expect(registrationNodeUsesComponent(map(`entries`), query)).toBe(false);
    expect(
      registrationNodeUsesComponent(map(`[['j', A], ['k', Comp]]`), query),
    ).toBe(true);
  });

  it('finds a class declared in the registrations file', () => {
    expect(usesIt('class Comp {}', 'Comp', {}, '/src/reg.ts')).toBe(true);
    expect(usesIt('class Comp {}', 'Comp', {}, '/src/comp.ts')).toBe(false);
  });

  it.each([
    ['class', 'export class Comp {}'],
    ['const', 'export const Comp = 1;'],
    ['function', 'export function Comp() {}'],
    ['enum', 'export enum Comp {}'],
    ['local export', 'class Comp {}\nexport { Comp };'],
  ])('finds an exported %s', (_, declaration) => {
    expect(usesIt(imported, 'Comp', { '/src/comp.ts': declaration })).toBe(
      true,
    );
  });

  it.each([
    ['class', 'class Comp {}'],
    ['const', 'const Comp = 1;'],
    ['function', 'function Comp() {}'],
    ['interface', 'export interface Comp {}'],
    ['destructuring', 'export const { Comp } = source;'],
    ['type export', 'class Comp {}\nexport type { Comp };'],
    ['other export', 'class Comp {}\nexport { Comp as Other };'],
    ['a renamed other class', 'class Inner {}\nexport { Inner as Comp };'],
    ['an inline type', 'class Comp {}\nexport { type Comp };'],
  ])('does not find %s', (_, declaration) => {
    expect(usesIt(imported, 'Comp', { '/src/comp.ts': declaration })).toBe(
      false,
    );
  });

  it.each([
    ['a star export', `export * from './comp';`],
    ['a named export', `export { Comp } from './comp';`],
    ['a chain', `export * from './middle';`],
    ['a second star', `export * from './none';\nexport * from './comp';`],
    [
      'a skipped name',
      `export { Other } from './none';\nexport * from './comp';`,
    ],
    ['a renamed export', `export { Comp as Renamed, Comp } from './comp';`],
    ['an import', `import { Comp } from './comp';\nexport { Comp };`],
    [
      'a renamed import',
      `import { Comp as C } from './comp';\nexport { C as Comp };`,
    ],
  ])('follows %s', (_, barrel) => {
    expect(
      usesIt(`import { Comp } from './barrel';`, 'Comp', {
        '/src/barrel.ts': barrel,
        '/src/middle.ts': `export * from './comp';`,
        '/src/comp.ts': DECLARATION,
      }),
    ).toBe(true);
  });

  it.each([
    ['a type export', `export type { Comp } from './comp';`],
    ['a type star', `export type * from './comp';`],
    ['another name', `export { Other as Comp2 } from './comp';`],
    ['an inline type', `export { type Comp } from './comp';`],
    ['a namespace export', `export * as Comp from './comp';`],
    ['a cycle', `export * from './loop';`],
    ['a missing file', `export * from './none';`],
    ['a package', `export * from 'pkg';`],
  ])('does not follow %s', (_, barrel) => {
    expect(
      usesIt(`import { Comp } from './barrel';`, 'Comp', {
        '/src/barrel.ts': barrel,
        '/src/loop.ts': `export * from './barrel';`,
        '/src/comp.ts': DECLARATION,
      }),
    ).toBe(false);
  });

  it('takes the barrel as the source of a re-export, not its declaration', () => {
    expect(
      usesIt(
        `import { Comp } from './barrel';`,
        'Comp',
        {
          '/src/barrel.ts': `export { Comp } from './comp';`,
          '/src/comp.ts': DECLARATION,
        },
        '/src/barrel.ts',
      ),
    ).toBe(false);
  });

  it('follows a rename to the class it stands for', () => {
    const files = {
      '/src/barrel.ts': `export { Comp as Renamed } from './comp';`,
      '/src/comp.ts': DECLARATION,
    };

    expect(
      usesIt(`import { Renamed } from './barrel';`, 'Renamed', files),
    ).toBe(true);
    expect(
      usesIt(`import { Renamed } from './barrel';`, 'Renamed', {
        '/src/barrel.ts': `export { Comp as Renamed } from './other';`,
        '/src/other.ts': `export class Comp {}`,
      }),
    ).toBe(false);
  });

  it('does not take a class renamed to the component name for the component', () => {
    expect(
      usesIt(`import { Comp } from './barrel';`, 'Comp', {
        '/src/barrel.ts': `export { Other as Comp } from './comp';`,
        '/src/comp.ts': `export class Comp {}\nexport class Other {}`,
      }),
    ).toBe(false);
  });
});
