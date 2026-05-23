import { TestBed } from '@angular/core/testing';
import { ExpressionService } from './expression.service';
import { FormContext } from '../../types/expression.type';

describe('ExpressionService — sandbox boundary', () => {
  let service: ExpressionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpressionService);
  });

  function evaluate(expression: string, context: FormContext = {}) {
    const ast = service.parseExpressionToAst(expression);
    return service.evaluateExpression(ast, context);
  }

  describe('parse-time rejections', () => {
    // After vendoring jsep, these are all parse errors rather than
    // evaluator-level denylist rejections. The grammar simply does not
    // accept any of these constructs.
    const cases: { name: string; expr: string }[] = [
      { name: 'new', expr: 'new Object()' },
      { name: 'assignment', expr: '(person.age = 99)' },
      { name: 'update', expr: '(person.age++)' },
      { name: 'function expression', expr: '(function(){})()' },
      { name: 'tagged template', expr: 'tag`hi`' },
      { name: 'await', expr: 'await x' },
      { name: 'dynamic import', expr: 'import("evil")' },
      { name: 'this', expr: 'this' },
      { name: 'class', expr: 'class Example {}' },
      { name: 'delete', expr: 'delete person.age' },
    ];

    for (const { name, expr } of cases) {
      it(`rejects ${name}`, () => {
        expect(() => evaluate(expr, { person: { age: 1 } })).toThrow();
      });
    }
  });

  describe('callable-escape attempts', () => {
    it('rejects calling a non-method (no IIFE)', () => {
      expect(() => evaluate('(() => 1)()')).toThrow(
        /Only method calls are supported/,
      );
    });

    it('rejects reading .constructor on an array (rejected at member access)', () => {
      expect(() =>
        evaluate('arr.constructor.constructor("return 1")', { arr: [] }),
      ).toThrow(/Invalid property access on array: constructor/);
    });

    it('rejects .call() on a function reference (rejected at member access)', () => {
      expect(() => evaluate('s.toUpperCase.call("hi")', { s: 'foo' })).toThrow(
        /Invalid property access on string: toUpperCase/,
      );
    });

    it('rejects .apply() on a function reference (rejected at member access)', () => {
      expect(() => evaluate('s.toUpperCase.apply("hi")', { s: 'foo' })).toThrow(
        /Invalid property access on string: toUpperCase/,
      );
    });

    it('rejects .bind() on a function reference (rejected at member access)', () => {
      expect(() => evaluate('s.toUpperCase.bind("hi")', { s: 'foo' })).toThrow(
        /Invalid property access on string: toUpperCase/,
      );
    });
  });

  describe('member access on arrays', () => {
    it('allows length', () => {
      expect(evaluate('arr.length', { arr: [1, 2, 3] })).toBe(3);
    });

    it('allows canonical integer indices', () => {
      expect(evaluate('arr[0]', { arr: [1, 2, 3] })).toBe(1);
      expect(evaluate('arr["1"]', { arr: [1, 2, 3] })).toBe(2);
    });

    it('rejects reading prototype methods as values', () => {
      expect(() => evaluate('arr.constructor', { arr: [] })).toThrow(
        /Invalid property access on array: constructor/,
      );
      expect(() => evaluate('arr.push', { arr: [] })).toThrow(
        /Invalid property access on array: push/,
      );
      expect(() => evaluate('arr.map', { arr: [] })).toThrow(
        /Invalid property access on array: map/,
      );
      expect(() => evaluate('arr.toString', { arr: [] })).toThrow(
        /Invalid property access on array: toString/,
      );
    });

    it('rejects non-canonical numeric strings', () => {
      expect(() => evaluate('arr["  1  "]', { arr: [1, 2, 3] })).toThrow(
        /Invalid property access on array/,
      );
      expect(() => evaluate('arr["0x1"]', { arr: [1, 2, 3] })).toThrow(
        /Invalid property access on array/,
      );
    });
  });

  describe('member access on plain objects', () => {
    it('returns own properties', () => {
      expect(evaluate('obj.x', { obj: { x: 42 } })).toBe(42);
      expect(evaluate('obj["y"]', { obj: { y: 'hello' } })).toBe('hello');
    });

    it('returns undefined for missing own properties', () => {
      expect(evaluate('obj.missing', { obj: { x: 1 } })).toBeUndefined();
    });

    it('does not resolve inherited Object.prototype members', () => {
      expect(evaluate('obj.constructor', { obj: {} })).toBeUndefined();
      expect(evaluate('obj.toString', { obj: {} })).toBeUndefined();
      expect(evaluate('obj.hasOwnProperty', { obj: {} })).toBeUndefined();
      expect(evaluate('obj.valueOf', { obj: {} })).toBeUndefined();
      expect(evaluate('obj.isPrototypeOf', { obj: {} })).toBeUndefined();
    });
  });

  describe('aliased method names on plain objects', () => {
    it('rejects calling a function-typed own property even if its key matches a SAFE_METHODS entry', () => {
      // A hostile context places a function under a name that happens to be
      // an allowed array method. The non-array object branch must still
      // reject, otherwise type-coincident naming would defeat the gate.
      expect(() =>
        evaluate('obj.map(1)', {
          obj: { map: () => 'pwned' },
        }),
      ).toThrow(/Method map is not supported/);
    });
  });

  describe('member access on functions', () => {
    it('rejects all property reads on function-typed values', () => {
      expect(() => evaluate('(x => x).constructor')).toThrow(
        /Cannot access properties on a function value/,
      );
      expect(() => evaluate('(x => x).name')).toThrow(
        /Cannot access properties on a function value/,
      );
      expect(() => evaluate('(x => x).bind')).toThrow(
        /Cannot access properties on a function value/,
      );
    });
  });

  describe('string member access', () => {
    it('returns length', () => {
      expect(evaluate('s.length', { s: 'abc' })).toBe(3);
    });

    it('returns characters by numeric index', () => {
      expect(evaluate('s[0]', { s: 'abc' })).toBe('a');
    });

    it('returns characters by canonical string index', () => {
      expect(evaluate('s["1"]', { s: 'abc' })).toBe('b');
    });

    it('rejects non-canonical numeric strings', () => {
      expect(() => evaluate('s["  1  "]', { s: 'abc' })).toThrow(
        /Invalid property access on string/,
      );
      expect(() => evaluate('s["0x1"]', { s: 'abc' })).toThrow(
        /Invalid property access on string/,
      );
      expect(() => evaluate('s["1e0"]', { s: 'abc' })).toThrow(
        /Invalid property access on string/,
      );
      expect(() => evaluate('s[""]', { s: 'abc' })).toThrow(
        /Invalid property access on string/,
      );
    });

    it('rejects raw method extraction', () => {
      expect(() => evaluate('s.toUpperCase', { s: 'abc' })).toThrow(
        /Invalid property access on string: toUpperCase/,
      );
      expect(() => evaluate('s.slice', { s: 'abc' })).toThrow(
        /Invalid property access on string: slice/,
      );
    });

    it('still allows calling safe methods through the call form', () => {
      expect(evaluate('s.toUpperCase()', { s: 'abc' })).toBe('ABC');
      expect(evaluate('s.slice(1)', { s: 'abc' })).toBe('bc');
    });
  });

  describe('non-whitelisted primitive methods', () => {
    it('rejects unsafe string methods', () => {
      expect(() => evaluate('s.matchAll("x")', { s: 'abc' })).toThrow(
        /Method matchAll is not supported on type string/,
      );
    });

    it('rejects unsafe number methods', () => {
      expect(() => evaluate('n.toExponential()', { n: 42 })).toThrow(
        /Method toExponential is not supported on type number/,
      );
    });
  });

  describe('context isolation', () => {
    it('does not see globals not present in the context', () => {
      expect(evaluate('globalThis')).toBeUndefined();
      expect(evaluate('window')).toBeUndefined();
      expect(evaluate('process')).toBeUndefined();
      expect(evaluate('Function')).toBeUndefined();
      expect(evaluate('eval')).toBeUndefined();
    });

    it('does not resolve inherited Object.prototype members', () => {
      expect(evaluate('constructor', {})).toBeUndefined();
      expect(evaluate('toString', {})).toBeUndefined();
      expect(evaluate('hasOwnProperty', {})).toBeUndefined();
      expect(evaluate('valueOf', {})).toBeUndefined();
      expect(evaluate('isPrototypeOf', {})).toBeUndefined();
      expect(evaluate('propertyIsEnumerable', {})).toBeUndefined();
      expect(evaluate('toLocaleString', {})).toBeUndefined();
    });

    it('resolves own properties even when they shadow Object.prototype', () => {
      expect(evaluate('toString', { toString: 'shadowed' })).toBe('shadowed');
    });

    it('throws on member access through an undefined identifier', () => {
      expect(() => evaluate('process.env')).toThrow(
        /Cannot access properties of null or undefined/,
      );
    });

    it('arrow function parameters do not leak into the outer context', () => {
      const context: FormContext = { items: [1, 2, 3] };
      const result = evaluate('items.map(x => x * 2)', context);
      expect(result).toEqual([2, 4, 6]);
      expect(context).toEqual({ items: [1, 2, 3] });
    });

    it('arrow body sees outer context identifiers', () => {
      expect(
        evaluate('arr.map(n => n + outer)', { arr: [1, 2, 3], outer: 10 }),
      ).toEqual([11, 12, 13]);
    });

    it('arrow parameters shadow outer context names', () => {
      // The outer x in the context is shadowed by the arrow's parameter x.
      expect(
        evaluate('arr.map(x => x)', { arr: [1, 2, 3], x: 999 }),
      ).toEqual([1, 2, 3]);
    });

    it('nested arrows resolve each level correctly', () => {
      expect(
        evaluate('outer.map(a => inner.map(b => a + b))', {
          outer: [10, 20],
          inner: [1, 2],
        }),
      ).toEqual([
        [11, 12],
        [21, 22],
      ]);
    });

    it('arrow parameter named `__proto__` is bound like any other identifier', () => {
      // Without the null-prototype frame, assigning to `paramFrame.__proto__`
      // would trigger the Object.prototype setter and lose the binding.
      expect(
        evaluate('arr.map(__proto__ => __proto__)', { arr: [1, 2, 3] }),
      ).toEqual([1, 2, 3]);
    });

    it('arrow parameter named `constructor` does not collide with Object.prototype', () => {
      expect(
        evaluate('arr.map(constructor => constructor)', { arr: ['a', 'b'] }),
      ).toEqual(['a', 'b']);
    });
  });

  describe('single-statement enforcement', () => {
    it('rejects multi-statement input separated by semicolons', () => {
      expect(() => evaluate('1; 2')).toThrow();
    });

    it('rejects multi-statement input separated by newlines', () => {
      expect(() => evaluate('1\n2')).toThrow();
    });

    it('rejects a trailing statement that would otherwise be denylisted', () => {
      expect(() => evaluate('x; y.z = 1', { x: 1, y: { z: 0 } })).toThrow();
    });

    it('still accepts a single expression statement', () => {
      expect(evaluate('1 + 1')).toBe(2);
    });
  });

  describe('input handling', () => {
    it('returns null for missing AST', () => {
      expect(service.evaluateExpression(null, {})).toBeNull();
      expect(service.evaluateExpression(undefined, {})).toBeNull();
    });

    it('returns null for missing context', () => {
      const ast = service.parseExpressionToAst('1 + 1');
      expect(service.evaluateExpression(ast, undefined)).toBeNull();
    });

    it('returns null for an empty expression string', () => {
      expect(service.parseExpressionToAst('')).toBeNull();
      expect(service.parseExpressionToAst(undefined)).toBeNull();
    });
  });

  describe('determinism', () => {
    it('produces the same value for repeated evaluations', () => {
      const ctx: FormContext = { n: 5 };
      const ast = service.parseExpressionToAst('n * 2 + 1');
      const first = service.evaluateExpression(ast, ctx);
      const second = service.evaluateExpression(ast, ctx);
      expect(first).toBe(11);
      expect(second).toBe(first);
    });

    it('does not mutate the context', () => {
      const ctx: FormContext = { items: [1, 2, 3], person: { age: 30 } };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const snapshot = JSON.parse(JSON.stringify(ctx));
      evaluate('items.map(x => x + 1).filter(x => x > 1)', ctx);
      evaluate('person.age > 18 ? "adult" : "minor"', ctx);
      expect(ctx).toEqual(snapshot);
    });
  });

  describe('array method gate', () => {
    const mutatorCases: { name: string; expr: string }[] = [
      { name: 'sort', expr: 'items.sort()' },
      { name: 'push', expr: 'items.push(2)' },
      { name: 'pop', expr: 'items.pop()' },
      { name: 'shift', expr: 'items.shift()' },
      { name: 'unshift', expr: 'items.unshift(0)' },
      { name: 'splice', expr: 'items.splice(0, 2)' },
      { name: 'reverse', expr: 'items.reverse()' },
      { name: 'fill', expr: 'items.fill(0)' },
      { name: 'copyWithin', expr: 'items.copyWithin(0, 1)' },
    ];

    for (const { name, expr } of mutatorCases) {
      it(`rejects array mutator ${name}`, () => {
        expect(() => evaluate(expr, { items: [1, 2, 3, 4, 5] })).toThrow(
          /Method \w+ is not supported/,
        );
      });
    }

    it('still allows map', () => {
      expect(evaluate('items.map(x => x * 2)', { items: [1, 2, 3, 4, 5] })).toEqual([
        2, 4, 6, 8, 10,
      ]);
    });

    it('still allows filter', () => {
      expect(evaluate('items.filter(x => x > 2)', { items: [1, 2, 3, 4, 5] })).toEqual([
        3, 4, 5,
      ]);
    });

    it('still allows reduce', () => {
      expect(
        evaluate('items.reduce((a, b) => a + b, 0)', { items: [1, 2, 3, 4, 5] }),
      ).toBe(15);
    });

    it('still allows slice', () => {
      expect(evaluate('items.slice(0, 2)', { items: [1, 2, 3, 4, 5] })).toEqual([
        1, 2,
      ]);
    });

    it('still allows includes', () => {
      expect(evaluate('items.includes(3)', { items: [1, 2, 3, 4, 5] })).toBe(true);
    });

    it('still allows length member access', () => {
      expect(evaluate('items.length', { items: [1, 2, 3, 4, 5] })).toBe(5);
    });

    it('preserves the determinism snapshot pattern after the gate change', () => {
      const ctx: FormContext = { items: [1, 2, 3], person: { age: 30 } };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const snapshot = JSON.parse(JSON.stringify(ctx));
      evaluate('items.map(x => x + 1).filter(x => x > 1)', ctx);
      evaluate('person.age > 18 ? "adult" : "minor"', ctx);
      expect(ctx).toEqual(snapshot);
    });
  });

  describe('spread in call arguments', () => {
    it('flattens an array spread into positional args', () => {
      expect(
        evaluate('s.concat(...rest)', { s: 'a', rest: ['b', 'c'] }),
      ).toBe('abc');
    });

    it('rejects spreading a non-array', () => {
      expect(() => evaluate('s.concat(...x)', { s: 'a', x: 42 })).toThrow(
        /Cannot spread non-array value in call arguments/,
      );
    });
  });

  describe('parser-level rejections for transient grammar shapes', () => {
    it('rejects template placeholders with multiple expressions', () => {
      expect(() => evaluate('`hello ${1; 2}`')).toThrow(
        /Template placeholder must contain exactly one expression/,
      );
    });

    it('rejects rest parameters in arrow functions', () => {
      // The rejection happens at parse time, when the lone SpreadElement
      // produced by `(...x)` reaches a position the grammar does not allow.
      expect(() => evaluate('arr.map((...x) => x)', { arr: [1, 2, 3] })).toThrow();
    });

    it('rejects ternary with a comma-sequence test', () => {
      expect(() => evaluate('arr.map(n => (1, 2) ? n : 0)', { arr: [1] })).toThrow();
    });
  });

  describe('non-array object method gate', () => {
    it('rejects Date mutator setHours', () => {
      expect(() => evaluate('d.setHours(12)', { d: new Date(2020, 0, 1) })).toThrow(
        /Method \w+ is not supported/,
      );
    });

    it('rejects Map mutator set', () => {
      expect(() => evaluate('m.set("k", "v")', { m: new Map() })).toThrow(
        /Method \w+ is not supported/,
      );
    });

    it('rejects Set mutator add', () => {
      expect(() => evaluate('s.add(1)', { s: new Set() })).toThrow(
        /Method \w+ is not supported/,
      );
    });

    it('rejects plain-object inherited toString', () => {
      expect(() => evaluate('obj.toString()', { obj: {} })).toThrow(
        /Method \w+ is not supported/,
      );
    });

    it('rejects plain-object inherited hasOwnProperty', () => {
      expect(() => evaluate('obj.hasOwnProperty("x")', { obj: { x: 1 } })).toThrow(
        /Method \w+ is not supported/,
      );
    });
  });
});
