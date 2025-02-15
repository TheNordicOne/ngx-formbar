import {
  computed,
  Directive,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NgxFwControl } from '../types/content.type';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';

@Directive({
  selector: '[ngxfwControl]',
})
export class NgxfwControlDirective<T extends NgxFwControl>
  implements OnInit, OnDestroy
{
  private parentContainer = inject(ControlContainer);

  readonly content = input.required<T>();
  readonly testId = computed(() => this.content().id);

  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  ngOnInit(): void {
    const formControl = new FormControl(this.content().defaultValue);

    this.parentFormGroup?.addControl(this.content().id, formControl, {
      emitEvent: false,
    });
  }

  ngOnDestroy(): void {
    this.parentFormGroup?.removeControl(this.content().id);
  }
}
