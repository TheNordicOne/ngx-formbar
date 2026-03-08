import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NgxFbBaseContent } from '../types/content.type';
import { TestIdBuilderFn } from '../types/functions.type';
import { resolveTestId } from './resolve-test-id';

describe('resolveTestId', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should return the name when no parent test ID and no builders', () => {
    TestBed.runInInjectionContext(() => {
      const content = signal<NgxFbBaseContent>({ type: 'input' });
      const name = signal('firstName');
      const testIdBuilder = signal<TestIdBuilderFn | undefined>(undefined);
      const parentTestId = signal<string | undefined>(undefined);

      const result = resolveTestId(
        content,
        name,
        testIdBuilder,
        undefined,
        parentTestId,
      );
      expect(result()).toBe('firstName');
    });
  });

  it('should join parent test ID and name with hyphen', () => {
    TestBed.runInInjectionContext(() => {
      const content = signal<NgxFbBaseContent>({ type: 'input' });
      const name = signal('firstName');
      const testIdBuilder = signal<TestIdBuilderFn | undefined>(undefined);
      const parentTestId = signal<string | undefined>('personalData');

      const result = resolveTestId(
        content,
        name,
        testIdBuilder,
        undefined,
        parentTestId,
      );
      expect(result()).toBe('personalData-firstName');
    });
  });

  it('should use local testIdBuilder when provided', () => {
    TestBed.runInInjectionContext(() => {
      const content = signal<NgxFbBaseContent>({ type: 'input' });
      const name = signal('firstName');
      const customBuilder: TestIdBuilderFn = (c, n) => `custom_${n}`;
      const testIdBuilder = signal<TestIdBuilderFn | undefined>(customBuilder);
      const parentTestId = signal<string | undefined>('parent');

      const result = resolveTestId(
        content,
        name,
        testIdBuilder,
        undefined,
        parentTestId,
      );
      expect(result()).toBe('custom_firstName');
    });
  });

  it('should use global testIdBuilder when no local builder', () => {
    TestBed.runInInjectionContext(() => {
      const content = signal<NgxFbBaseContent>({ type: 'input' });
      const name = signal('firstName');
      const testIdBuilder = signal<TestIdBuilderFn | undefined>(undefined);
      const globalBuilder: TestIdBuilderFn = (c, n, p) =>
        p ? `${p}__${n}` : n;
      const parentTestId = signal<string | undefined>('form');

      const result = resolveTestId(
        content,
        name,
        testIdBuilder,
        globalBuilder,
        parentTestId,
      );
      expect(result()).toBe('form__firstName');
    });
  });

  it('should prefer local builder over global builder', () => {
    TestBed.runInInjectionContext(() => {
      const content = signal<NgxFbBaseContent>({ type: 'input' });
      const name = signal('firstName');
      const localBuilder: TestIdBuilderFn = (c, n) => `local-${n}`;
      const globalBuilder: TestIdBuilderFn = (c, n) => `global-${n}`;
      const testIdBuilder = signal<TestIdBuilderFn | undefined>(localBuilder);
      const parentTestId = signal<string | undefined>(undefined);

      const result = resolveTestId(
        content,
        name,
        testIdBuilder,
        globalBuilder,
        parentTestId,
      );
      expect(result()).toBe('local-firstName');
    });
  });

  it('should react to name changes', () => {
    TestBed.runInInjectionContext(() => {
      const content = signal<NgxFbBaseContent>({ type: 'input' });
      const name = signal('firstName');
      const testIdBuilder = signal<TestIdBuilderFn | undefined>(undefined);
      const parentTestId = signal<string | undefined>(undefined);

      const result = resolveTestId(
        content,
        name,
        testIdBuilder,
        undefined,
        parentTestId,
      );
      expect(result()).toBe('firstName');

      name.set('lastName');
      expect(result()).toBe('lastName');
    });
  });

  it('should react to parent test ID changes', () => {
    TestBed.runInInjectionContext(() => {
      const content = signal<NgxFbBaseContent>({ type: 'input' });
      const name = signal('field');
      const testIdBuilder = signal<TestIdBuilderFn | undefined>(undefined);
      const parentTestId = signal<string | undefined>(undefined);

      const result = resolveTestId(
        content,
        name,
        testIdBuilder,
        undefined,
        parentTestId,
      );
      expect(result()).toBe('field');

      parentTestId.set('group');
      expect(result()).toBe('group-field');
    });
  });
});
