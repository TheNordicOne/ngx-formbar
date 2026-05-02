import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { StateHandling } from '@ngx-formbar/core';
import { disabledEffect } from './disabled.state';

describe('disabledEffect', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should call disableFunction when disabled is true and handling is auto', () => {
    TestBed.runInInjectionContext(() => {
      const enableFn = vi.fn();
      const disableFn = vi.fn();

      disabledEffect({
        disabledSignal: signal(true),
        disabledHandlingSignal: signal<StateHandling>('auto'),
        enableFunction: enableFn,
        disableFunction: disableFn,
      });

      TestBed.tick();

      expect(disableFn).toHaveBeenCalled();
      expect(enableFn).not.toHaveBeenCalled();
    });
  });

  it('should call enableFunction when disabled is false and handling is auto', () => {
    TestBed.runInInjectionContext(() => {
      const enableFn = vi.fn();
      const disableFn = vi.fn();

      disabledEffect({
        disabledSignal: signal(false),
        disabledHandlingSignal: signal<StateHandling>('auto'),
        enableFunction: enableFn,
        disableFunction: disableFn,
      });

      TestBed.tick();

      expect(enableFn).toHaveBeenCalled();
      expect(disableFn).not.toHaveBeenCalled();
    });
  });

  it('should not call any function when handling is manual', () => {
    TestBed.runInInjectionContext(() => {
      const enableFn = vi.fn();
      const disableFn = vi.fn();

      disabledEffect({
        disabledSignal: signal(true),
        disabledHandlingSignal: signal<StateHandling>('manual'),
        enableFunction: enableFn,
        disableFunction: disableFn,
      });

      TestBed.tick();

      expect(enableFn).not.toHaveBeenCalled();
      expect(disableFn).not.toHaveBeenCalled();
    });
  });

  it('should react to disabled signal changes', () => {
    TestBed.runInInjectionContext(() => {
      const enableFn = vi.fn();
      const disableFn = vi.fn();
      const disabled = signal(false);

      disabledEffect({
        disabledSignal: disabled,
        disabledHandlingSignal: signal<StateHandling>('auto'),
        enableFunction: enableFn,
        disableFunction: disableFn,
      });

      TestBed.tick();
      expect(enableFn).toHaveBeenCalledTimes(1);

      disabled.set(true);
      TestBed.tick();
      expect(disableFn).toHaveBeenCalledTimes(1);
    });
  });

  it('should react to handling signal changes', () => {
    TestBed.runInInjectionContext(() => {
      const enableFn = vi.fn();
      const disableFn = vi.fn();
      const handling = signal<StateHandling>('manual');

      disabledEffect({
        disabledSignal: signal(true),
        disabledHandlingSignal: handling,
        enableFunction: enableFn,
        disableFunction: disableFn,
      });

      TestBed.tick();
      expect(disableFn).not.toHaveBeenCalled();

      handling.set('auto');
      TestBed.tick();
      expect(disableFn).toHaveBeenCalledTimes(1);
    });
  });
});
