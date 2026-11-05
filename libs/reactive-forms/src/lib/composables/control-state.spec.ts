import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { withControlState } from './control-state';

describe('withControlState', () => {
  function state(control: FormControl) {
    return TestBed.runInInjectionContext(() =>
      withControlState(signal(control)),
    );
  }

  it('starts without errors and pristine before the first read of the control', () => {
    const control = new FormControl('', Validators.required);
    control.markAsDirty();

    const { errors, isDirty } = state(control);

    expect(errors()).toBeNull();
    expect(isDirty()).toBe(false);
  });

  it('follows the control after that', () => {
    const control = new FormControl('', Validators.required);
    const { errors, isDirty } = state(control);

    TestBed.tick();
    expect(errors()).toEqual({ required: true });
    expect(isDirty()).toBe(false);

    control.setValue('value');
    control.markAsDirty();

    expect(errors()).toBeNull();
    expect(isDirty()).toBe(true);
  });
});
