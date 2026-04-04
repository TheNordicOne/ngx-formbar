import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { resolveHiddenAttribute } from './resolve-hidden-attribute';

describe('resolveHiddenAttribute', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should return true when hidden and visibility is handled by library', () => {
    TestBed.runInInjectionContext(() => {
      const result = resolveHiddenAttribute({
        hiddenSignal: signal(true),
        handleVisibility: signal(true),
      });
      expect(result()).toBe(true);
    });
  });

  it('should return null when not hidden and visibility is handled by library', () => {
    TestBed.runInInjectionContext(() => {
      const result = resolveHiddenAttribute({
        hiddenSignal: signal(false),
        handleVisibility: signal(true),
      });
      expect(result()).toBeNull();
    });
  });

  it('should return null when component handles visibility regardless of hidden state', () => {
    TestBed.runInInjectionContext(() => {
      const result = resolveHiddenAttribute({
        hiddenSignal: signal(true),
        handleVisibility: signal(false),
      });
      expect(result()).toBeNull();
    });
  });

  it('should react to hidden signal changes', () => {
    TestBed.runInInjectionContext(() => {
      const hidden = signal(false);
      const result = resolveHiddenAttribute({
        hiddenSignal: hidden,
        handleVisibility: signal(true),
      });

      expect(result()).toBeNull();

      hidden.set(true);
      expect(result()).toBe(true);
    });
  });

  it('should react to handleVisibility signal changes', () => {
    TestBed.runInInjectionContext(() => {
      const handleVisibility = signal(true);
      const result = resolveHiddenAttribute({
        hiddenSignal: signal(true),
        handleVisibility,
      });

      expect(result()).toBe(true);

      handleVisibility.set(false);
      expect(result()).toBeNull();
    });
  });
});
