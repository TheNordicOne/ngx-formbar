import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ExpressionService } from '../services/expression';
import { FormContext } from '../types/expression.type';
import { resolveExpression } from './resolve-expression';

describe('resolveExpression', () => {
  let expressionService: ExpressionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    expressionService = TestBed.inject(ExpressionService);
  });

  it('should return undefined when option is undefined', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<string | undefined>(undefined);
      const formContext = signal<FormContext>({ name: 'test' });

      const result = resolveExpression<string>(
        option,
        formContext,
        expressionService,
      );
      expect(result()).toBeUndefined();
    });
  });

  it('should return a static boolean value', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<boolean | undefined>(true);
      const formContext = signal<FormContext>({});

      const result = resolveExpression<boolean>(
        option,
        formContext,
        expressionService,
      );
      expect(result()).toBe(true);
    });
  });

  it('should return a static false value', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<boolean | undefined>(false);
      const formContext = signal<FormContext>({});

      const result = resolveExpression<boolean>(
        option,
        formContext,
        expressionService,
      );
      expect(result()).toBe(false);
    });
  });

  it('should evaluate a function expression', () => {
    TestBed.runInInjectionContext(() => {
      const fn = (ctx: FormContext) => ctx['name'] as string;
      const option = signal<
        string | ((ctx: FormContext) => string) | undefined
      >(fn);
      const formContext = signal<FormContext>({ name: 'Hans' });

      const result = resolveExpression<string>(
        option,
        formContext,
        expressionService,
      );
      expect(result()).toBe('Hans');
    });
  });

  it('should evaluate a string expression', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<
        string | ((ctx: FormContext) => string) | undefined
      >('name');
      const formContext = signal<FormContext>({ name: 'Hans' });

      const result = resolveExpression<string>(
        option,
        formContext,
        expressionService,
      );
      expect(result()).toBe('Hans');
    });
  });

  it('should evaluate a complex string expression', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<
        string | ((ctx: FormContext) => boolean) | undefined
      >('age > 18');
      const formContext = signal<FormContext>({ age: 25 });

      const result = resolveExpression<boolean>(
        option,
        formContext,
        expressionService,
      );
      expect(result()).toBe(true);
    });
  });

  it('should react to form context changes', () => {
    TestBed.runInInjectionContext(() => {
      const fn = (ctx: FormContext) => ctx['count'] as number;
      const option = signal<
        number | ((ctx: FormContext) => number) | undefined
      >(fn);
      const formContext = signal<FormContext>({ count: 1 });

      const result = resolveExpression<number>(
        option,
        formContext,
        expressionService,
      );
      expect(result()).toBe(1);

      formContext.set({ count: 42 });
      expect(result()).toBe(42);
    });
  });

  it('should react to option changes', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<boolean | string | undefined>(true);
      const formContext = signal<FormContext>({});

      const result = resolveExpression<boolean>(
        option,
        formContext,
        expressionService,
      );
      expect(result()).toBe(true);

      option.set(undefined);
      expect(result()).toBeUndefined();
    });
  });

  it('should switch from static to function expression', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<
        boolean | ((ctx: FormContext) => boolean) | undefined
      >(true);
      const formContext = signal<FormContext>({ active: false });

      const result = resolveExpression<boolean>(
        option,
        formContext,
        expressionService,
      );
      expect(result()).toBe(true);

      option.set((ctx: FormContext) => ctx['active'] as boolean);
      expect(result()).toBe(false);
    });
  });

  it('should switch from function to string expression', () => {
    TestBed.runInInjectionContext(() => {
      const fn = (ctx: FormContext) => ctx['name'] as string;
      const option = signal<
        string | ((ctx: FormContext) => string) | undefined
      >(fn);
      const formContext = signal<FormContext>({
        name: 'Hans',
        greeting: 'Hello',
      });

      const result = resolveExpression<string>(
        option,
        formContext,
        expressionService,
      );
      expect(result()).toBe('Hans');

      option.set('greeting');
      expect(result()).toBe('Hello');
    });
  });
});
