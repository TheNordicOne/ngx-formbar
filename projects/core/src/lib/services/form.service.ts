import { inject, Injectable } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormContext } from '../types/expression.type';

@Injectable()
export class FormService {
  private controlContainer = inject(ControlContainer);
  private formGroup = this.controlContainer.control as FormGroup;
  readonly formValue = toSignal<FormContext>(this.formGroup.valueChanges);
}
