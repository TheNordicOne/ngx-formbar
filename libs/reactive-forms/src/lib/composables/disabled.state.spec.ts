import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { disabledEffect } from './disabled.state';

describe('disabledEffect', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should call disableFunction when disabled is true and handleDisable is true', () => {
    TestBed.runInInjectionContext(() => {
      const enableFn = vi.fn();
      const disableFn = vi.fn();

      disabledEffect({
        disabledSignal: signal(true),
        handleDisableSignal: signal(true),
        enableFunction: enableFn,
        disableFunction: disableFn,
      });

      TestBed.tick();

      expect(disableFn).toHaveBeenCalled();
      expect(enableFn).not.toHaveBeenCalled();
    });
  });

  it('should call enableFunction when disabled is false and handleDisable is true', () => {
    TestBed.runInInjectionContext(() => {
      const enableFn = vi.fn();
      const disableFn = vi.fn();

      disabledEffect({
        disabledSignal: signal(false),
        handleDisableSignal: signal(true),
        enableFunction: enableFn,
        disableFunction: disableFn,
      });

      TestBed.tick();

      expect(enableFn).toHaveBeenCalled();
      expect(disableFn).not.toHaveBeenCalled();
    });
  });

  it('should not call any function when handleDisable is false', () => {
    TestBed.runInInjectionContext(() => {
      const enableFn = vi.fn();
      const disableFn = vi.fn();

      disabledEffect({
        disabledSignal: signal(true),
        handleDisableSignal: signal(false),
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
        handleDisableSignal: signal(true),
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

  it('should react to handleDisable signal changes', () => {
    TestBed.runInInjectionContext(() => {
      const enableFn = vi.fn();
      const disableFn = vi.fn();
      const handleDisable = signal(false);

      disabledEffect({
        disabledSignal: signal(true),
        handleDisableSignal: handleDisable,
        enableFunction: enableFn,
        disableFunction: disableFn,
      });

      TestBed.tick();
      expect(disableFn).not.toHaveBeenCalled();

      handleDisable.set(true);
      TestBed.tick();
      expect(disableFn).toHaveBeenCalledTimes(1);
    });
  });
});
