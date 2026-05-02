import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { disabledEffect } from './disabled.state';

describe('disabledEffect', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should disable the instance when disabled is true and handleDisable is true', () => {
    TestBed.runInInjectionContext(() => {
      const control = new FormControl();

      disabledEffect({
        disabledSignal: signal(true),
        handleDisableSignal: signal(true),
        instance: signal(control),
      });

      TestBed.tick();

      expect(control.disabled).toBe(true);
    });
  });

  it('should enable the instance when disabled is false and handleDisable is true', () => {
    TestBed.runInInjectionContext(() => {
      const control = new FormControl();
      control.disable();

      disabledEffect({
        disabledSignal: signal(false),
        handleDisableSignal: signal(true),
        instance: signal(control),
      });

      TestBed.tick();

      expect(control.disabled).toBe(false);
    });
  });

  it('should not toggle the instance when handleDisable is false', () => {
    TestBed.runInInjectionContext(() => {
      const control = new FormControl();
      const enableSpy = vi.spyOn(control, 'enable');
      const disableSpy = vi.spyOn(control, 'disable');

      disabledEffect({
        disabledSignal: signal(true),
        handleDisableSignal: signal(false),
        instance: signal(control),
      });

      TestBed.tick();

      expect(enableSpy).not.toHaveBeenCalled();
      expect(disableSpy).not.toHaveBeenCalled();
    });
  });

  it('should react to disabled signal changes', () => {
    TestBed.runInInjectionContext(() => {
      const control = new FormControl();
      const disabled = signal(false);

      disabledEffect({
        disabledSignal: disabled,
        handleDisableSignal: signal(true),
        instance: signal(control),
      });

      TestBed.tick();
      expect(control.disabled).toBe(false);

      disabled.set(true);
      TestBed.tick();
      expect(control.disabled).toBe(true);
    });
  });

  it('should react to handleDisable signal changes', () => {
    TestBed.runInInjectionContext(() => {
      const control = new FormControl();
      const handleDisable = signal(false);

      disabledEffect({
        disabledSignal: signal(true),
        handleDisableSignal: handleDisable,
        instance: signal(control),
      });

      TestBed.tick();
      expect(control.disabled).toBe(false);

      handleDisable.set(true);
      TestBed.tick();
      expect(control.disabled).toBe(true);
    });
  });
});
