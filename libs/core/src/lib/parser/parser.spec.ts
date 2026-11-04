import { parse } from './index';

const a: object = { type: 'Identifier', name: 'a' };
const b: object = { type: 'Identifier', name: 'b' };
const c: object = { type: 'Identifier', name: 'c' };
const d: object = { type: 'Identifier', name: 'd' };

function num(value: number): object {
  return { type: 'Literal', value, raw: String(value) };
}

function bin(left: object, operator: string, right: object) {
  return { type: 'BinaryExpression', operator, left, right };
}

function member(object: object, property: object, computed = false) {
  return { type: 'MemberExpression', computed, object, property };
}

function shorthand(key: object) {
  return {
    type: 'Property',
    computed: false,
    key,
    value: key,
    shorthand: true,
  };
}

function property(key: object, value: object, computed = false) {
  return { type: 'Property', computed, key, value, shorthand: false };
}

function quasi(raw: string, cooked: string, tail: boolean) {
  return { type: 'TemplateElement', value: { raw, cooked }, tail };
}

function errorOf(source: string) {
  try {
    parse(source);
  } catch (error) {
    return error;
  }
  throw new Error(`Expected ${source} to be rejected`);
}

describe('parse', () => {
  it('wraps the expression in a program', () => {
    expect(parse('a')).toEqual({ type: 'Program', body: a });
  });

  it('reports where and what went wrong on the error', () => {
    expect(errorOf('a b')).toMatchObject({
      message: 'Expression must contain exactly one expression at character 3',
      index: 3,
      description: 'Expression must contain exactly one expression',
    });
  });

  it.each([
    ['', 'Empty expression at character 0'],
    ['   ', 'Empty expression at character 3'],
    ['\t', 'Empty expression at character 1'],
    ['\n', 'Empty expression at character 1'],
    ['\r', 'Empty expression at character 1'],
    ['()', 'Empty expression at character 2'],
    ['a; b', 'Expression must contain exactly one expression at character 4'],
    ['a, b', 'Expression must contain exactly one expression at character 4'],
    [
      'a in b c',
      'Expression must contain exactly one expression at character 8',
    ],
    ['@', 'Unexpected "@" at character 0'],
    ['* 2', 'Unexpected "*" at character 0'],
    ['() + 1', 'Unexpected "+" at character 3'],
    ['a = b', 'Unexpected "=" at character 2'],
    ['\u007f', 'Unexpected "\u007f" at character 0'],
    ['a\u007f', 'Unexpected "\u007f" at character 1'],
    [
      '...a',
      'Spread is only valid inside arrays, objects, or call arguments at character 4',
    ],
    ['(...a)', 'Spread is not valid in this position'],
    ['(a, b)', 'Comma sequences are not supported at character 6'],
    ['(a, b).c', 'Comma sequences are not supported at character 6'],
    ['(a, b)[c]', 'Comma sequences are not supported at character 6'],
    ['(a, b)(c)', 'Comma sequences are not supported at character 6'],
    ['a[(b, c)]', 'Comma sequences are not supported'],
    ['-(a, b)', 'Comma sequences are not supported'],
    ['f((a, b))', 'Comma sequences are not supported at character 8'],
    ['[(a, b)]', 'Comma sequences are not supported at character 7'],
    ['this', 'The `this` keyword is not supported at character 4'],
    ['this.a', 'The `this` keyword is not supported at character 4'],
  ])('rejects %j with %j', (source, message) => {
    expect(errorOf(source)).toHaveProperty('message', message);
  });

  describe('binary expressions', () => {
    it.each([
      ['1 +', 'Expected expression after + at character 3'],
      ['1 + 2 *', 'Expected expression after * at character 7'],
      ['a in', 'Expected expression after in at character 4'],
      ['a ===', 'Expected expression after === at character 5'],
    ])('rejects %j with %j', (source, message) => {
      expect(errorOf(source)).toHaveProperty('message', message);
    });

    it.each(['||', '??', '&&'])('makes %s a logical expression', (operator) => {
      expect(parse(`a ${operator} b`).body).toEqual({
        type: 'LogicalExpression',
        operator,
        left: a,
        right: b,
      });
    });

    it.each([
      '|',
      '^',
      '&',
      '==',
      '!=',
      '===',
      '!==',
      '<',
      '>',
      '<=',
      '>=',
      'in',
      '<<',
      '>>',
      '>>>',
      '+',
      '-',
      '*',
      '/',
      '%',
      '**',
    ])('reads %s with and without spaces', (operator) => {
      expect(parse(`a ${operator} b`).body).toEqual(bin(a, operator, b));
    });

    it.each([
      ['a - b - c', bin(bin(a, '-', b), '-', c)],
      ['a ** b ** c', bin(a, '**', bin(b, '**', c))],
      ['a + b * c', bin(a, '+', bin(b, '*', c))],
      ['a * b + c', bin(bin(a, '*', b), '+', c)],
      ['a ** b * c', bin(bin(a, '**', b), '*', c)],
      ['a * b ** c', bin(a, '*', bin(b, '**', c))],
      ['a + b * c - d', bin(bin(a, '+', bin(b, '*', c)), '-', d)],
      ['a << b + c', bin(a, '<<', bin(b, '+', c))],
      ['a < b == c', bin(bin(a, '<', b), '==', c)],
      ['a | b ^ c & d', bin(a, '|', bin(b, '^', bin(c, '&', d)))],
    ])('groups %s by precedence', (source, ast) => {
      expect(parse(source).body).toEqual(ast);
    });

    it.each(['a\tb', 'a\nb', 'a\rb', 'a b'])(
      'does not read the whitespace in %j as an operator',
      (source) => {
        expect(errorOf(source)).toHaveProperty(
          'description',
          'Expression must contain exactly one expression',
        );
      },
    );

    it.each(['a\t+ b', 'a\n+ b', 'a\r+ b', 'a + b'])(
      'skips the whitespace in %j',
      (source) => {
        expect(parse(source).body).toEqual(bin(a, '+', b));
      },
    );

    it('reads an identifier that starts with a word operator as an identifier', () => {
      expect(errorOf('a inb')).toHaveProperty(
        'description',
        'Expression must contain exactly one expression',
      );
    });
  });

  describe('unary expressions', () => {
    it.each(['-', '!', '~', '+', 'typeof', 'void'])('reads %s', (operator) => {
      expect(parse(`${operator} a`).body).toEqual({
        type: 'UnaryExpression',
        operator,
        argument: a,
        prefix: true,
      });
    });

    it.each(['-', '!', 'typeof', 'void'])(
      'rejects %s without an argument',
      (op) => {
        expect(errorOf(op)).toHaveProperty(
          'message',
          `missing unaryOp argument at character ${String(op.length)}`,
        );
      },
    );

    it('reads an identifier that starts with a word operator as an identifier', () => {
      expect(parse('typeofa').body).toEqual({
        type: 'Identifier',
        name: 'typeofa',
      });
    });
  });

  describe('numbers', () => {
    it.each([
      ['0', 0],
      ['1.5', 1.5],
      ['.5', 0.5],
      ['5.', 5],
      ['1e3', 1000],
      ['1E3', 1000],
      ['1e+3', 1000],
      ['1e-3', 0.001],
      ['1.5e3', 1500],
      ['.5e1', 5],
      ['5.e1', 50],
    ])('reads %s', (source, value) => {
      expect(parse(source).body).toEqual({
        type: 'Literal',
        value,
        raw: source,
      });
    });

    it.each([
      ['1e', 'Expected exponent (1e) at character 2'],
      ['1E', 'Expected exponent (1E) at character 2'],
      ['1e+', 'Expected exponent (1e+) at character 3'],
      ['1e-', 'Expected exponent (1e-) at character 3'],
      ['1a', 'Variable names cannot start with a number (1a) at character 1'],
      [
        '1.5a',
        'Variable names cannot start with a number (1.5a) at character 3',
      ],
      [
        '1e5a',
        'Variable names cannot start with a number (1e5a) at character 3',
      ],
      ['1_', 'Variable names cannot start with a number (1_) at character 1'],
      ['.', 'Unexpected period at character 1'],
      ['..', 'Unexpected period at character 1'],
      ['1.5.2', 'Unexpected period at character 3'],
      ['1..', 'Unexpected period at character 2'],
    ])('rejects %j with %j', (source, message) => {
      expect(errorOf(source)).toHaveProperty('message', message);
    });
  });

  describe('strings', () => {
    it.each([
      ['"abc"', 'abc'],
      ["'abc'", 'abc'],
      ['"a\'b"', "a'b"],
      ['"a\\"b"', 'a"b'],
      ['"\\\\"', '\\'],
      ['"\\n\\r\\t\\b\\f\\v\\q"', '\n\r\t\b\f\x0Bq'],
    ])('reads %s', (source, value) => {
      expect(parse(source).body).toEqual({
        type: 'Literal',
        value,
        raw: source,
      });
    });

    it.each([
      ['"abc', 'Unclosed quote after "abc" at character 4'],
      ["'abc", 'Unclosed quote after "abc" at character 4'],
      ['"a\\', 'Unclosed quote after "a" at character 4'],
    ])('rejects %j with %j', (source, message) => {
      expect(errorOf(source)).toHaveProperty('message', message);
    });
  });

  describe('identifiers and literals', () => {
    it.each(['$', '_', 'a$', 'a_1', 'a1', 'A', 'Z', 'z', 'é', 'é1', '\u0080'])(
      'reads %s as an identifier',
      (name) => {
        expect(parse(name).body).toEqual({ type: 'Identifier', name });
      },
    );

    it.each([
      ['true', true],
      ['false', false],
      ['null', null],
    ])('reads %s as a literal', (raw, value) => {
      expect(parse(raw).body).toEqual({ type: 'Literal', value, raw });
    });

    it('does not read a longer name as a literal', () => {
      expect(parse('truex').body).toEqual({
        type: 'Identifier',
        name: 'truex',
      });
    });
  });

  describe('member access and calls', () => {
    it.each([
      ['a.b', member(a, b)],
      ['a . b', member(a, b)],
      ['a\n.b', member(a, b)],
      ['a[b]', member(a, b, true)],
      ['a [ b ]', member(a, b, true)],
      ['a?.b', { ...member(a, b), optional: true }],
      ['a ?. b', { ...member(a, b), optional: true }],
      ['a?.[b]', { ...member(a, b, true), optional: true }],
      ['a?.[ b ]', { ...member(a, b, true), optional: true }],
      ['(a).b', member(a, b)],
      ['"a".b', member({ type: 'Literal', value: 'a', raw: '"a"' }, b)],
      ['[a].b', member({ type: 'ArrayExpression', elements: [a] }, b)],
      ['{}.b', member({ type: 'ObjectExpression', properties: [] }, b)],
      [
        '`a`.b',
        member(
          {
            type: 'TemplateLiteral',
            quasis: [
              {
                type: 'TemplateElement',
                value: { raw: 'a', cooked: 'a' },
                tail: true,
              },
            ],
            expressions: [],
          },
          b,
        ),
      ],
    ])('reads %s', (source, ast) => {
      expect(parse(source).body).toEqual(ast);
    });

    it.each([
      ['a(b)', { type: 'CallExpression', arguments: [b], callee: a }],
      ['a (b)', { type: 'CallExpression', arguments: [b], callee: a }],
      ['a()', { type: 'CallExpression', arguments: [], callee: a }],
      [
        'a?.(b)',
        { type: 'CallExpression', arguments: [b], callee: a, optional: true },
      ],
      ['a(b, c)', { type: 'CallExpression', arguments: [b, c], callee: a }],
      [
        'a(...b)',
        {
          type: 'CallExpression',
          arguments: [{ type: 'SpreadElement', argument: b }],
          callee: a,
        },
      ],
    ])('reads %s', (source, ast) => {
      expect(parse(source).body).toEqual(ast);
    });

    it.each([
      ['a[', 'Unexpected "" at character 2'],
      ['a[]', 'Unexpected "]" at character 2'],
      ['a[1', 'Unclosed [ at character 3'],
      ['a.', 'Unexpected  at character 2'],
      ['a.1', 'Unexpected 1 at character 2'],
      ['a..b', 'Unexpected . at character 2'],
      ['a?.', 'Unexpected  at character 3'],
      ['(a', 'Unclosed ( at character 2'],
      ['(', 'Unclosed ( at character 1'],
      ['a(', 'Expected ) at character 2'],
      ['a(b', 'Expected ) at character 3'],
      ['a(,b)', 'Unexpected token , at character 3'],
      ['a(b,,c)', 'Unexpected token , at character 5'],
      ['a(b,)', 'Unexpected token ) at character 5'],
      ['a(b c)', 'Expected comma at character 4'],
      ['a(b, c d)', 'Expected comma at character 7'],
    ])('rejects %j with %j', (source, message) => {
      expect(errorOf(source)).toHaveProperty('message', message);
    });
  });

  describe('arrays', () => {
    it.each([
      ['[]', []],
      ['[a]', [a]],
      ['[a,]', [a]],
      ['[a, b]', [a, b]],
      ['[,]', [null]],
      ['[a,,b]', [a, null, b]],
      ['[,,a]', [null, null, a]],
      ['[...a]', [{ type: 'SpreadElement', argument: a }]],
    ])('reads %s', (source, elements) => {
      expect(parse(source).body).toEqual({ type: 'ArrayExpression', elements });
    });

    it.each([
      ['[', 'Expected ] at character 1'],
      ['[a', 'Expected ] at character 2'],
      ['[a b]', 'Expected comma at character 3'],
      ['[@]', 'Expected comma at character 1'],
      ['a(@)', 'Expected comma at character 2'],
      ['[a, b c]', 'Expected comma at character 6'],
    ])('rejects %j with %j', (source, message) => {
      expect(errorOf(source)).toHaveProperty('message', message);
    });
  });

  describe('objects', () => {
    it.each([
      ['{}', []],
      ['{ }', []],
      ['{a}', [shorthand(a)]],
      ['{ a , b }', [shorthand(a), shorthand(b)]],
      ['{a,}', [shorthand(a)]],
      ['{a: b}', [property(a, b)]],
      ['{ a : b , c : d }', [property(a, b), property(c, d)]],
      ['{a: b,}', [property(a, b)]],
      ['{[a]: b}', [property(a, b, true)]],
      ['{...a}', [{ type: 'SpreadElement', argument: a }]],
      ['{...a, b}', [{ type: 'SpreadElement', argument: a }, shorthand(b)]],
      ['{1: a}', [property(num(1), a)]],
      ['{"x": a}', [property({ type: 'Literal', value: 'x', raw: '"x"' }, a)]],
    ])('reads %s', (source, properties) => {
      expect(parse(source).body).toEqual({
        type: 'ObjectExpression',
        properties,
      });
    });

    it.each([
      ['{', 'missing } at character 1'],
      ['{a', 'Expected : after a property name at character 2'],
      ['{,}', 'missing } at character 1'],
      ['{a,,b}', 'missing } at character 3'],
      ['{a: b c: d}', 'missing } at character 6'],
      ['{...a b}', 'missing } at character 6'],
      ['{...a: b}', 'missing } at character 5'],
      ['{a:', 'unexpected object property at character 3'],
      ['{a: ...b}', 'unexpected object property at character 8'],
      ['{a b}', 'Expected : after a property name at character 3'],
      ['{1 2}', 'Expected : after a property name at character 3'],
      ['{[a]}', 'Expected : after a property name at character 4'],
      ['{[a, b]: c}', 'Expected a property name at character 7'],
      ['{[]: a}', 'Expected a property name at character 3'],
      ['{a + b: c}', 'Expected a property name at character 6'],
    ])('rejects %j with %j', (source, message) => {
      expect(errorOf(source)).toHaveProperty('message', message);
    });
  });

  describe('spread', () => {
    it.each([
      ['[...]', 'Expected expression after ... at character 4'],
      ['[...(a, b)]', 'Expected expression after ... at character 10'],
      ['[......a]', 'Expected expression after ... at character 8'],
    ])('rejects %j with %j', (source, message) => {
      expect(errorOf(source)).toHaveProperty('message', message);
    });
  });

  describe('ternaries', () => {
    function ternary(test: unknown, consequent: unknown, alternate: unknown) {
      return { type: 'ConditionalExpression', test, consequent, alternate };
    }

    it.each([
      ['a ? b : c', ternary(a, b, c)],
      ['a?b:c', ternary(a, b, c)],
      ['a ? b : c ? d : a', ternary(a, b, ternary(c, d, a))],
      ['a ? b ? c : d : a', ternary(a, ternary(b, c, d), a)],
      [
        'a || b ? c : d',
        ternary(
          { type: 'LogicalExpression', operator: '||', left: a, right: b },
          c,
          d,
        ),
      ],
    ])('reads %s', (source, ast) => {
      expect(parse(source).body).toEqual(ast);
    });

    it.each([
      ['a ? b', 'Expected : at character 5'],
      ['a ? : c', 'Expected expression at character 4'],
      ['a ? b :', 'Expected expression at character 7'],
      ['a ? ...b : c', 'Expected expression at character 9'],
      ['a ? b : ...c', 'Expected expression at character 12'],
      [
        '(a, b) ? c : d',
        'Ternary test must be a single expression, not a sequence at character 8',
      ],
    ])('rejects %j with %j', (source, message) => {
      expect(errorOf(source)).toHaveProperty('message', message);
    });

    it.each([['a => b ? c : d'], ['(a) => b ? c : d']])(
      'keeps the ternary in the body of %s',
      (source) => {
        expect(parse(source).body).toEqual({
          type: 'ArrowFunctionExpression',
          params: [a],
          body: ternary(b, c, d),
        });
      },
    );

    it('keeps the ternary in the innermost body of curried arrows', () => {
      expect(parse('a => b => a ? c : d').body).toEqual({
        type: 'ArrowFunctionExpression',
        params: [a],
        body: {
          type: 'ArrowFunctionExpression',
          params: [b],
          body: ternary(a, c, d),
        },
      });
    });

    it('spreads the whole ternary', () => {
      expect(parse('[...a ? b : c]').body).toEqual({
        type: 'ArrayExpression',
        elements: [{ type: 'SpreadElement', argument: ternary(a, b, c) }],
      });
    });

    it('takes an arrow as a branch', () => {
      expect(parse('a ? b => c : d').body).toEqual(
        ternary(
          a,
          { type: 'ArrowFunctionExpression', params: [b], body: c },
          d,
        ),
      );
    });
  });

  describe('arrow functions', () => {
    it.each([
      ['a => b', [a], b],
      ['(a) => b', [a], b],
      ['(a, b) => c', [a, b], c],
      ['(a, b, c) => d', [a, b, c], d],
      ['() => a', [], a],
      ['( ) => a', [], a],
      ['()=>a', [], a],
    ])('reads %s', (source, params, body) => {
      expect(parse(source).body).toEqual({
        type: 'ArrowFunctionExpression',
        params,
        body,
      });
    });

    it('keeps a ternary in the body of an arrow without parameters', () => {
      expect(parse('() => a ? b : c').body).toEqual({
        type: 'ArrowFunctionExpression',
        params: [],
        body: {
          type: 'ConditionalExpression',
          test: a,
          consequent: b,
          alternate: c,
        },
      });
    });

    it.each([
      [
        'a => b ** c',
        [a],
        { type: 'BinaryExpression', operator: '**', left: b, right: c },
      ],
      [
        'a => b + c',
        [a],
        { type: 'BinaryExpression', operator: '+', left: b, right: c },
      ],
    ])('keeps the operator in the body of %s', (source, params, body) => {
      expect(parse(source).body).toEqual({
        type: 'ArrowFunctionExpression',
        params,
        body,
      });
    });

    it('reads an arrow inside an arrow', () => {
      expect(parse('() => () => a').body).toEqual({
        type: 'ArrowFunctionExpression',
        params: [],
        body: { type: 'ArrowFunctionExpression', params: [], body: a },
      });
    });

    it('finds an arrow nested in an argument', () => {
      expect(parse('a(b => c)').body).toEqual({
        type: 'CallExpression',
        callee: a,
        arguments: [{ type: 'ArrowFunctionExpression', params: [b], body: c }],
      });
    });

    it.each([
      ['() =>', 'Expected expression after => at character 5'],
      [
        '() => ...a',
        'Arrow function body must be an expression, got SpreadElement at character 10',
      ],
      [
        '() => (a, b)',
        'Arrow function body must be an expression, got SequenceExpression at character 12',
      ],
      [
        'a => ...b',
        'Arrow function body must be an expression, got SpreadElement',
      ],
      [
        'a => (b, c)',
        'Arrow function body must be an expression, got SequenceExpression',
      ],
      [
        '(1) => a',
        'Arrow function parameters must be plain identifiers, got Literal',
      ],
      [
        'a.b => c',
        'Arrow function parameters must be plain identifiers, got MemberExpression',
      ],
      [
        '(a, 1) => b',
        'Arrow function parameters must be plain identifiers, got Literal',
      ],
    ])('rejects %j with %j', (source, message) => {
      expect(errorOf(source)).toHaveProperty('message', message);
    });
  });

  describe('template literals', () => {
    it.each([
      ['``', [quasi('', '', true)], []],
      ['`a`', [quasi('a', 'a', true)], []],
      ['`$a`', [quasi('$a', '$a', true)], []],
      ['`a{b}`', [quasi('a{b}', 'a{b}', true)], []],
      ['`\\${a}`', [quasi('\\${a}', '${a}', true)], []],
      [
        '`\\n\\r\\t\\b\\f\\v\\q`',
        [quasi('\\n\\r\\t\\b\\f\\v\\q', '\n\r\t\b\f\x0Bq', true)],
        [],
      ],
      ['`${a}`', [quasi('', '', false), quasi('', '', true)], [a]],
      [
        '`x${a}y${b}z`',
        [quasi('x', 'x', false), quasi('y', 'y', false), quasi('z', 'z', true)],
        [a, b],
      ],
    ])('reads %s', (source, quasis, expressions) => {
      expect(parse(source).body).toEqual({
        type: 'TemplateLiteral',
        quasis,
        expressions,
      });
    });

    it.each([
      ['`a', 'Unclosed ` at character 2'],
      ['`\\', 'Unclosed ` at character 2'],
      ['`$', 'Unclosed ` at character 2'],
      ['`${a}', 'Unclosed ` at character 5'],
      ['`${a', 'unclosed ${ at character 4'],
      [
        '`${}`',
        'Template placeholder must contain exactly one expression at character 3',
      ],
      [
        '`${a b}`',
        'Template placeholder must contain exactly one expression at character 6',
      ],
      [
        '`${...a}`',
        'Spread and comma sequences are not valid in template literal at character 7',
      ],
      [
        '`${(a, b)}`',
        'Spread and comma sequences are not valid in template literal at character 9',
      ],
    ])('rejects %j with %j', (source, message) => {
      expect(errorOf(source)).toHaveProperty('message', message);
    });
  });

  describe('regular expressions', () => {
    it.each([
      ['/a/', /a/],
      ['/ /', / /],
      ['/a/gi', /a/gi],
      ['/[/]/', /[/]/],
      ['/\\//', /\//],
      ['/a\\/b/', /a\/b/],
      ['/\\[/', /\[/],
      ['/[\\]]/', /[\]]/],
      ['/[a]b/', /[a]b/],
    ])('reads %s', (source, value) => {
      expect(parse(source).body).toEqual({
        type: 'Literal',
        value,
        raw: source,
      });
    });

    it('stops the flags at the first other character', () => {
      expect(parse('/a/g.b').body).toEqual(
        member({ type: 'Literal', value: /a/g, raw: '/a/g' }, b),
      );
    });

    it('reads a slash after an object as a division', () => {
      const object = { type: 'ObjectExpression', properties: [] };

      expect(parse('{} / b / c').body).toEqual(
        bin(bin(object, '/', b), '/', c),
      );
    });

    it('still reads a slash after an operand as a division', () => {
      expect(parse('a / b / c').body).toEqual(bin(bin(a, '/', b), '/', c));
    });

    it.each(['a', 'z', 'A', 'Z', '0', '9'])('collects %s as a flag', (flag) => {
      expect(errorOf(`/a/${flag}`)).toHaveProperty(
        'description',
        expect.stringContaining(`'${flag}'`),
      );
    });

    it.each(['@', '[', '{', '`', ':', '/'])(
      'does not collect %s as a flag',
      (char) => {
        expect(errorOf(`/a/${char}`)).toHaveProperty(
          'description',
          expect.not.stringContaining('flags'),
        );
      },
    );

    it.each([
      ['/a', 'Unclosed Regex at character 2'],
      ['/[a/', 'Unclosed Regex at character 4'],
      ['/\\/', 'Unclosed Regex at character 3'],
      ['/[]/]/', 'Unexpected "]" at character 4'],
    ])('rejects %j with %j', (source, message) => {
      expect(errorOf(source)).toHaveProperty('message', message);
    });

    it('reports an invalid pattern', () => {
      expect(errorOf('/(/')).toHaveProperty(
        'description',
        expect.stringContaining('Invalid regular expression'),
      );
    });
  });
});
