import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NgxFbBaseContent } from '../types/content.type';
import { TestIdBuilderFn } from '../types/functions.type';
import { resolveTestId } from './resolve-test-id';

describe('resolveTestId', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should return the name when no parent test ID and no global builder', () => {
    TestBed.runInInjectionContext(() => {
      const content = signal<NgxFbBaseContent>({ type: 'input' });
      const name = signal('firstName');
      const parentTestId = signal<string | undefined>(undefined);

      const result = resolveTestId(content, name, undefined, parentTestId);
      expect(result()).toBe('firstName');
    });
  });

  it('should join parent test ID and name with hyphen', () => {
    TestBed.runInInjectionContext(() => {
      const content = signal<NgxFbBaseContent>({ type: 'input' });
      const name = signal('firstName');
      const parentTestId = signal<string | undefined>('personalData');

      const result = resolveTestId(content, name, undefined, parentTestId);
      expect(result()).toBe('personalData-firstName');
    });
  });

  it('should use the global testIdBuilder when provided', () => {
    TestBed.runInInjectionContext(() => {
      const content = signal<NgxFbBaseContent>({ type: 'input' });
      const name = signal('firstName');
      const globalBuilder: TestIdBuilderFn = (c, n, p) =>
        p ? `${p}__${n}` : n;
      const parentTestId = signal<string | undefined>('form');

      const result = resolveTestId(content, name, globalBuilder, parentTestId);
      expect(result()).toBe('form__firstName');
    });
  });

  it('should react to name changes', () => {
    TestBed.runInInjectionContext(() => {
      const content = signal<NgxFbBaseContent>({ type: 'input' });
      const name = signal('firstName');
      const parentTestId = signal<string | undefined>(undefined);

      const result = resolveTestId(content, name, undefined, parentTestId);
      expect(result()).toBe('firstName');

      name.set('lastName');
      expect(result()).toBe('lastName');
    });
  });

  it('should react to parent test ID changes', () => {
    TestBed.runInInjectionContext(() => {
      const content = signal<NgxFbBaseContent>({ type: 'input' });
      const name = signal('field');
      const parentTestId = signal<string | undefined>(undefined);

      const result = resolveTestId(content, name, undefined, parentTestId);
      expect(result()).toBe('field');

      parentTestId.set('group');
      expect(result()).toBe('group-field');
    });
  });
});
