import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ExpressionService } from '../services/expression.service';
import { FormContext } from '../types/expression.type';
import { resolveInheritableExpression } from './resolve-inheritable-expression';

describe('resolveInheritableExpression', () => {
  let expressionService: ExpressionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    expressionService = TestBed.inject(ExpressionService);
  });

  it('should inherit parent state when option is undefined', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<boolean | undefined>(undefined);
      const formContext = signal<FormContext>({});
      const parentState = signal(true);

      const result = resolveInheritableExpression(
        option,
        formContext,
        expressionService,
        parentState,
      );
      expect(result()).toBe(true);
    });
  });

  it('should inherit false parent state when option is undefined', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<boolean | undefined>(undefined);
      const formContext = signal<FormContext>({});
      const parentState = signal(false);

      const result = resolveInheritableExpression(
        option,
        formContext,
        expressionService,
        parentState,
      );
      expect(result()).toBe(false);
    });
  });

  it('should return static boolean true', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<boolean | undefined>(true);
      const formContext = signal<FormContext>({});
      const parentState = signal(false);

      const result = resolveInheritableExpression(
        option,
        formContext,
        expressionService,
        parentState,
      );
      expect(result()).toBe(true);
    });
  });

  it('should return static boolean false', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<boolean | undefined>(false);
      const formContext = signal<FormContext>({});
      const parentState = signal(true);

      const result = resolveInheritableExpression(
        option,
        formContext,
        expressionService,
        parentState,
      );
      expect(result()).toBe(false);
    });
  });

  it('should evaluate a string expression', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<string | boolean | undefined>('age > 18');
      const formContext = signal<FormContext>({ age: 25 });
      const parentState = signal(false);

      const result = resolveInheritableExpression(
        option,
        formContext,
        expressionService,
        parentState,
      );
      expect(result()).toBe(true);
    });
  });

  it('should evaluate a function expression', () => {
    TestBed.runInInjectionContext(() => {
      const fn = (ctx: FormContext) => (ctx['active'] as boolean);
      const option = signal<
        boolean | ((ctx: FormContext) => boolean) | undefined
      >(fn);
      const formContext = signal<FormContext>({ active: true });
      const parentState = signal(false);

      const result = resolveInheritableExpression(
        option,
        formContext,
        expressionService,
        parentState,
      );
      expect(result()).toBe(true);
    });
  });

  it('should react to parent state changes when option is undefined', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<boolean | undefined>(undefined);
      const formContext = signal<FormContext>({});
      const parentState = signal(false);

      const result = resolveInheritableExpression(
        option,
        formContext,
        expressionService,
        parentState,
      );
      expect(result()).toBe(false);

      parentState.set(true);
      expect(result()).toBe(true);
    });
  });

  it('should ignore parent state when option is defined', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<boolean | undefined>(false);
      const formContext = signal<FormContext>({});
      const parentState = signal(true);

      const result = resolveInheritableExpression(
        option,
        formContext,
        expressionService,
        parentState,
      );
      expect(result()).toBe(false);

      parentState.set(false);
      expect(result()).toBe(false);
    });
  });

  it('should react to form context changes for expressions', () => {
    TestBed.runInInjectionContext(() => {
      const fn = (ctx: FormContext) => (ctx['disabled'] as boolean);
      const option = signal<
        boolean | ((ctx: FormContext) => boolean) | undefined
      >(fn);
      const formContext = signal<FormContext>({ disabled: false });
      const parentState = signal(false);

      const result = resolveInheritableExpression(
        option,
        formContext,
        expressionService,
        parentState,
      );
      expect(result()).toBe(false);

      formContext.set({ disabled: true });
      expect(result()).toBe(true);
    });
  });
});
