import {
  computed,
  Directive,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { NgxFwFormGroup } from '../types/content.type';
import { ControlContainer, FormGroup } from '@angular/forms';
import { ContentRegistrationService } from '../services/content-registration.service';

@Directive({
  selector: '[ngxfwGroup]',
})
export class NgxfwGroupDirective<T extends NgxFwFormGroup>
  implements OnInit, OnDestroy
{
  private parentContainer = inject(ControlContainer);
  private readonly contentRegistrationService = inject(
    ContentRegistrationService,
  );

  readonly content = input.required<T>();
  readonly testId = computed(() => this.content().id);
  readonly title = computed(() => this.content().title);
  readonly controls = computed(() => this.content().controls);
  readonly registrations = this.contentRegistrationService.registrations;

  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  ngOnInit(): void {
    this.parentFormGroup?.addControl(this.content().id, new FormGroup([]), {
      emitEvent: false,
    });
  }

  ngOnDestroy(): void {
    this.parentFormGroup?.removeControl(this.content().id);
  }
}
