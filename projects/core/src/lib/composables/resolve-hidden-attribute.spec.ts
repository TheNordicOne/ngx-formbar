import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { StateHandling } from '../types/registration.type';
import { resolveHiddenAttribute } from './resolve-hidden-attribute';

describe('resolveHiddenAttribute', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should return true when hidden and handling is auto', () => {
    TestBed.runInInjectionContext(() => {
      const result = resolveHiddenAttribute({
        hiddenSignal: signal(true),
        hiddenHandlingSignal: signal<StateHandling>('auto'),
      });
      expect(result()).toBe(true);
    });
  });

  it('should return null when not hidden and handling is auto', () => {
    TestBed.runInInjectionContext(() => {
      const result = resolveHiddenAttribute({
        hiddenSignal: signal(false),
        hiddenHandlingSignal: signal<StateHandling>('auto'),
      });
      expect(result()).toBeNull();
    });
  });

  it('should return null when handling is manual regardless of hidden state', () => {
    TestBed.runInInjectionContext(() => {
      const result = resolveHiddenAttribute({
        hiddenSignal: signal(true),
        hiddenHandlingSignal: signal<StateHandling>('manual'),
      });
      expect(result()).toBeNull();
    });
  });

  it('should react to hidden signal changes', () => {
    TestBed.runInInjectionContext(() => {
      const hidden = signal(false);
      const result = resolveHiddenAttribute({
        hiddenSignal: hidden,
        hiddenHandlingSignal: signal<StateHandling>('auto'),
      });

      expect(result()).toBeNull();

      hidden.set(true);
      expect(result()).toBe(true);
    });
  });

  it('should react to handling signal changes', () => {
    TestBed.runInInjectionContext(() => {
      const handling = signal<StateHandling>('auto');
      const result = resolveHiddenAttribute({
        hiddenSignal: signal(true),
        hiddenHandlingSignal: handling,
      });

      expect(result()).toBe(true);

      handling.set('manual');
      expect(result()).toBeNull();
    });
  });
});
