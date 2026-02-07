import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ExpressionService } from '../services/expression.service';
import { FormContext } from '../types/expression.type';
import { resolveHiddenState } from './resolve-hidden-state';

describe('resolveHiddenState', () => {
  let expressionService: ExpressionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    expressionService = TestBed.inject(ExpressionService);
  });

  it('should inherit parent hidden state when option is undefined', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<boolean | string | undefined>(undefined);
      const formContext = signal<FormContext>({});
      const parentHiddenState = signal(true);

      const result = resolveHiddenState(
        option,
        formContext,
        expressionService,
        parentHiddenState,
      );
      expect(result()).toBe(true);
    });
  });

  it('should return false when option is undefined and parent is not hidden', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<boolean | string | undefined>(undefined);
      const formContext = signal<FormContext>({});
      const parentHiddenState = signal(false);

      const result = resolveHiddenState(
        option,
        formContext,
        expressionService,
        parentHiddenState,
      );
      expect(result()).toBe(false);
    });
  });

  it('should use only resolved value for function expressions (ignore parent)', () => {
    TestBed.runInInjectionContext(() => {
      const fn = (ctx: FormContext) => (ctx['hide'] as boolean);
      const option = signal<
        boolean | string | ((ctx: FormContext) => boolean) | undefined
      >(fn);
      const formContext = signal<FormContext>({ hide: false });
      const parentHiddenState = signal(true);

      const result = resolveHiddenState(
        option,
        formContext,
        expressionService,
        parentHiddenState,
      );
      expect(result()).toBe(false);
    });
  });

  it('should OR string expression result with parent hidden state', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<
        boolean | string | ((ctx: FormContext) => boolean) | undefined
      >('age > 50');
      const formContext = signal<FormContext>({ age: 25 });
      const parentHiddenState = signal(true);

      const result = resolveHiddenState(
        option,
        formContext,
        expressionService,
        parentHiddenState,
      );
      // Expression is false, but parent is true → true
      expect(result()).toBe(true);
    });
  });

  it('should return true when string expression is true and parent is not hidden', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<
        boolean | string | ((ctx: FormContext) => boolean) | undefined
      >('age > 50');
      const formContext = signal<FormContext>({ age: 60 });
      const parentHiddenState = signal(false);

      const result = resolveHiddenState(
        option,
        formContext,
        expressionService,
        parentHiddenState,
      );
      expect(result()).toBe(true);
    });
  });

  it('should return false when string expression is false and parent is not hidden', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<
        boolean | string | ((ctx: FormContext) => boolean) | undefined
      >('age > 50');
      const formContext = signal<FormContext>({ age: 25 });
      const parentHiddenState = signal(false);

      const result = resolveHiddenState(
        option,
        formContext,
        expressionService,
        parentHiddenState,
      );
      expect(result()).toBe(false);
    });
  });

  it('should return static boolean true', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<boolean | string | undefined>(true);
      const formContext = signal<FormContext>({});
      const parentHiddenState = signal(false);

      const result = resolveHiddenState(
        option,
        formContext,
        expressionService,
        parentHiddenState,
      );
      // boolean is not a function, so it ORs with parent: true || false = true
      expect(result()).toBe(true);
    });
  });

  it('should react to parent hidden state changes for string expressions', () => {
    TestBed.runInInjectionContext(() => {
      const option = signal<
        boolean | string | ((ctx: FormContext) => boolean) | undefined
      >('age > 50');
      const formContext = signal<FormContext>({ age: 25 });
      const parentHiddenState = signal(false);

      const result = resolveHiddenState(
        option,
        formContext,
        expressionService,
        parentHiddenState,
      );
      expect(result()).toBe(false);

      parentHiddenState.set(true);
      expect(result()).toBe(true);
    });
  });

  it('should react to form context changes', () => {
    TestBed.runInInjectionContext(() => {
      const fn = (ctx: FormContext) => (ctx['hide'] as boolean);
      const option = signal<
        boolean | string | ((ctx: FormContext) => boolean) | undefined
      >(fn);
      const formContext = signal<FormContext>({ hide: false });
      const parentHiddenState = signal(false);

      const result = resolveHiddenState(
        option,
        formContext,
        expressionService,
        parentHiddenState,
      );
      expect(result()).toBe(false);

      formContext.set({ hide: true });
      expect(result()).toBe(true);
    });
  });
});
