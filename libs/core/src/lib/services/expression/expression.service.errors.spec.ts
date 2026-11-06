import { TestBed } from '@angular/core/testing';
import type { Program } from '../../parser';
import type { FormContext } from '../../types/expression.type';
import { ExpressionService } from './expression.service';

describe('ExpressionService runtime contract', () => {
  let service: ExpressionService;

  beforeEach(() => {
    service = TestBed.inject(ExpressionService);
  });

  function run(source: string, context: FormContext = {}) {
    return service.evaluateExpression(
      service.parseExpressionToAst(source),
      context,
    );
  }

  function errorOf(source: string, context: FormContext = {}) {
    try {
      run(source, context);
    } catch (error) {
      return error;
    }
    throw new Error(`Expected ${source} to throw`);
  }

  const context: FormContext = {
    n: null,
    nested: { nothing: null, value: 1 },
    list: ['x', 'y'],
    text: 'ab',
    count: 1,
    flag: true,
    key: 'dynamic',
    symbol: Symbol('s'),
    big: BigInt(1),
    d: 5,
  };

  it.each([
    [
      'nested[flag]',
      'Property accessor must be a string or number, but was boolean',
    ],
    [
      'nested[missing]',
      'Property accessor must be a string or number, but was undefined',
    ],
    [
      'n.a',
      'Cannot access properties of null or undefined (Reading: a from n)',
    ],
    [
      'missing.a',
      'Cannot access properties of null or undefined (Reading: a from missing)',
    ],
    [
      'nested.nothing.a',
      'Cannot access properties of null or undefined (Reading: a)',
    ],
    ['(x => x).a', 'Cannot access properties on a function value: .a'],
    ['count.a', 'Cannot access properties on a number value: 1.a'],
    ['flag.a', 'Cannot access properties on a boolean value: true.a'],
    ['symbol.a', 'Cannot access properties on a symbol value: .a'],
    ['big.a', 'Cannot access properties on a bigint value: .a'],
    ['[...text]', 'Cannot spread non-array value in array literal'],
    ['{...count}', 'Cannot spread non-object value in object literal'],
    ['{...n}', 'Cannot spread non-object value in object literal'],
    [
      'text.concat(...count)',
      'Cannot spread non-array value in call arguments',
    ],
    ['-text', 'Unary - operator requires a number'],
    ['+flag', 'Unary + operator requires a number or string'],
    ['+text', 'Cannot convert string "ab" to number'],
    ['~text', 'Bitwise NOT (~) operator requires a number'],
    ['text()', 'Only method calls are supported'],
    ['n.a()', 'Cannot call methods on null or undefined'],
    ['missing.a()', 'Cannot call methods on null or undefined'],
    ['n.a?.()', 'Cannot call methods on null or undefined'],
    ['text[flag]()', 'Method name must be a string or number'],
    ['text[0]()', 'Method 0 is not supported on type string'],
    ['text.a()', 'Method a is not supported on type string'],
    ['count.a()', 'Method a is not supported on type number'],
    ['nested.value()', 'Method value is not supported on type object'],
    ['text - 1', '- operator requires numbers'],
    ['1 - text', '- operator requires numbers'],
    ['1 / 0', 'Division by zero'],
    ['1 % 0', 'Modulo by zero'],
    [
      '1 < text',
      '< operator requires operands of the same type (numbers or strings)',
    ],
    [
      'text < 1',
      '< operator requires operands of the same type (numbers or strings)',
    ],
    ['flag + 1', '+ operator requires numbers or strings'],
    ['"a" in n', 'Right operand must be an object for "in" operator'],
    ['"a" in 1', 'Right operand must be an object for "in" operator'],
    ['1 in nested', 'Left operand must be of type string for "in" operator'],
    ['list[-1]', 'Invalid property access on array: -1'],
    ['list[1.5]', 'Invalid property access on array: 1.5'],
    ['list["1x"]', 'Invalid property access on array: 1x'],
    ['list["x1"]', 'Invalid property access on array: x1'],
    ['list["01"]', 'Invalid property access on array: 01'],
    ['text.a', 'Invalid property access on string: a'],
  ])('rejects %s with %j', (source, message) => {
    expect(errorOf(source, context)).toHaveProperty('message', message);
  });

  it('names a node type it cannot evaluate', () => {
    const ast = { type: 'Program', body: { type: 'Other' } };

    expect(() =>
      service.evaluateExpression(ast as unknown as Program, context),
    ).toThrow(new TypeError('Unsupported node type: Other'));
  });

  it.each([
    ['{[key]: 1}', { dynamic: 1 }],
    ['{key: 1}', { key: 1 }],
    ['{"a": 1}', { a: 1 }],
    ['{1: 2}', { 1: 2 }],
    ['text["toUpperCase"]()', 'AB'],
    ['list["1"]', 'y'],
    ['list["10"]', undefined],
    ['list[0]', 'x'],
    ['list[10]', undefined],
    ['-count', -1],
    ['+"2"', 2],
    ['+count', 1],
    ['~count', -2],
    ['1 > 0', true],
    ['"b" > "a"', true],
    ['1 < 0', false],
    ['"b" < "a"', false],
    ['1 <= 1', true],
    ['1 >= 1', true],
    ['8 >> 1', 4],
    ['-8 >> 1', -4],
    ['1 < 1', false],
    ['0 || "x"', 'x'],
    ['"a" || "b"', 'a'],
    ['list.map(x => count ** 2)', [1, 1]],
    ['"a" + 1', 'a1'],
    ['1 + "a"', '1a'],
    ['1 + 1', 2],
    ['"a" + "b"', 'ab'],
    ['"a" in {a: 1}', true],
  ])('evaluates %s', (source, value) => {
    expect(run(source, context)).toEqual(value);
  });

  describe('optional chains', () => {
    it.each([
      ['n?.a', undefined],
      ['n?.a.b', undefined],
      ['n?.a.b.c', undefined],
      ['n?.a[0]', undefined],
      ['n?.a()', undefined],
      ['n?.a.b()', undefined],
      ['n?.a().b', undefined],
      ['missing?.a.b', undefined],
      ['nested?.value', 1],
    ])('evaluates %s', (source, value) => {
      expect(run(source, context)).toEqual(value);
    });

    it('still rejects a null that the optional link did not guard', () => {
      expect(errorOf('nested?.nothing.a', context)).toHaveProperty(
        'message',
        'Cannot access properties of null or undefined (Reading: a)',
      );
    });
  });

  describe('arrow functions', () => {
    it('shadows an outer name with a parameter that got no argument', () => {
      expect(run('list.map((a, b, c, d) => d)', context)).toEqual([
        undefined,
        undefined,
      ]);
    });

    it('binds a ternary body without parameters', () => {
      expect(run('list.map(() => flag ? 1 : 2)', context)).toEqual([1, 1]);
    });
  });

  it('gives every evaluation a fresh regular expression', () => {
    const ast = service.parseExpressionToAst('"aa".replace(/a/y, "b")');

    expect(service.evaluateExpression(ast, context)).toBe('ba');
    expect(service.evaluateExpression(ast, context)).toBe('ba');
  });

  it('reads the flags of an expression parsed once', () => {
    expect(run('"aa".replace(/a/g, "b")', context)).toBe('bb');
  });
});
