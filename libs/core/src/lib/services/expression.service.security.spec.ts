import { TestBed } from '@angular/core/testing';
import { ExpressionService } from './expression.service';
import { FormContext } from '../types/expression.type';

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

  describe('AST-level rejections', () => {
    const cases: { name: string; expr: string; match: RegExp }[] = [
      {
        name: 'new',
        expr: 'new Object()',
        match: /NewExpression is not supported/,
      },
      {
        name: 'assignment',
        expr: '(person.age = 99)',
        match: /AssignmentExpression is not supported/,
      },
      {
        name: 'update',
        expr: '(person.age++)',
        match: /UpdateExpression is not supported/,
      },
      {
        name: 'function expression (rejected before evaluation)',
        expr: '(function(){})()',
        match: /Only method calls are supported/,
      },
      {
        name: 'tagged template',
        expr: 'tag`hi`',
        match: /TaggedTemplateExpression is not supported/,
      },
      {
        name: 'await (rejected at parse)',
        expr: 'await x',
        match: /Unexpected token/,
      },
      {
        name: 'dynamic import',
        expr: 'import("evil")',
        match: /ImportExpression is not supported/,
      },
    ];

    for (const { name, expr, match } of cases) {
      it(`rejects ${name}`, () => {
        expect(() => evaluate(expr, { person: { age: 1 } })).toThrow(match);
      });
    }
  });

  describe('callable-escape attempts', () => {
    it('rejects calling a non-method (no IIFE)', () => {
      expect(() => evaluate('(() => 1)()')).toThrow(
        /Only method calls are supported/,
      );
    });

    it('rejects invoking the Function constructor reached via .constructor.constructor', () => {
      expect(() => evaluate('arr.constructor.constructor("return 1")', { arr: [] })).toThrow(
        /not supported on type function/,
      );
    });

    it('rejects .call() on a function reference', () => {
      expect(() =>
        evaluate('s.toUpperCase.call("hi")', { s: 'foo' }),
      ).toThrow(/not supported on type function/);
    });

    it('rejects .apply() on a function reference', () => {
      expect(() =>
        evaluate('s.toUpperCase.apply("hi")', { s: 'foo' }),
      ).toThrow(/not supported on type function/);
    });

    it('rejects .bind() on a function reference', () => {
      expect(() =>
        evaluate('s.toUpperCase.bind("hi")', { s: 'foo' }),
      ).toThrow(/not supported on type function/);
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
      const snapshot = JSON.parse(JSON.stringify(ctx));
      evaluate('items.map(x => x + 1).filter(x => x > 1)', ctx);
      evaluate('person.age > 18 ? "adult" : "minor"', ctx);
      expect(ctx).toEqual(snapshot);
    });
  });
});
