import { computed, effect, inject, Injectable, Signal } from '@angular/core';
import { ControlContainer, FormGroup, FormResetEvent } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormContext } from '@ngx-formbar/core';
import { filter } from 'rxjs';
import { FORM_LIFECYCLE_STATE } from './form-lifecycle-state';

@Injectable()
export class FormService {
  private controlContainer = inject(ControlContainer);
  private formLifecycleState = inject(FORM_LIFECYCLE_STATE);

  get formGroup(): FormGroup {
    return this.controlContainer.control as FormGroup;
  }

  private readonly valueChangesSignal = toSignal<FormContext>(
    this.formGroup.valueChanges,
  );

  readonly formValue: Signal<FormContext> = computed(
    () => this.valueChangesSignal() ?? (this.formGroup.value as FormContext),
  );

  readonly formReset: Signal<FormResetEvent | undefined> = toSignal(
    this.formGroup.events.pipe(
      filter((event) => event instanceof FormResetEvent),
    ),
  );

  constructor() {
    effect(() => {
      if (this.formReset()) {
        this.formLifecycleState.clear();
      }
    });
  }
}
