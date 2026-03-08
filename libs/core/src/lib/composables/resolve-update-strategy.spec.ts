import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { UpdateStrategy } from '../types/content.type';
import { resolveUpdateStrategy } from './resolve-update-strategy';

describe('resolveUpdateStrategy', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should return the control strategy when defined', () => {
    TestBed.runInInjectionContext(() => {
      const result = resolveUpdateStrategy(
        signal<UpdateStrategy | undefined>('blur'),
        signal<UpdateStrategy | undefined>(undefined),
        'change',
      );
      expect(result()).toBe('blur');
    });
  });

  it('should fall back to parent strategy when control strategy is undefined', () => {
    TestBed.runInInjectionContext(() => {
      const result = resolveUpdateStrategy(
        signal<UpdateStrategy | undefined>(undefined),
        signal<UpdateStrategy | undefined>('submit'),
        'change',
      );
      expect(result()).toBe('submit');
    });
  });

  it('should fall back to default strategy when both are undefined', () => {
    TestBed.runInInjectionContext(() => {
      const result = resolveUpdateStrategy(
        signal<UpdateStrategy | undefined>(undefined),
        signal<UpdateStrategy | undefined>(undefined),
        'change',
      );
      expect(result()).toBe('change');
    });
  });

  it('should prefer control over parent strategy', () => {
    TestBed.runInInjectionContext(() => {
      const result = resolveUpdateStrategy(
        signal<UpdateStrategy | undefined>('blur'),
        signal<UpdateStrategy | undefined>('submit'),
        'change',
      );
      expect(result()).toBe('blur');
    });
  });

  it('should react to control strategy changes', () => {
    TestBed.runInInjectionContext(() => {
      const controlStrategy = signal<UpdateStrategy | undefined>(undefined);
      const result = resolveUpdateStrategy(
        controlStrategy,
        signal<UpdateStrategy | undefined>(undefined),
        'change',
      );
      expect(result()).toBe('change');

      controlStrategy.set('blur');
      expect(result()).toBe('blur');
    });
  });

  it('should react to parent strategy changes', () => {
    TestBed.runInInjectionContext(() => {
      const parentStrategy = signal<UpdateStrategy | undefined>(undefined);
      const result = resolveUpdateStrategy(
        signal<UpdateStrategy | undefined>(undefined),
        parentStrategy,
        'change',
      );
      expect(result()).toBe('change');

      parentStrategy.set('submit');
      expect(result()).toBe('submit');
    });
  });
});
