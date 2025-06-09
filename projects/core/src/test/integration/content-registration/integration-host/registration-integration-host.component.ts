import { Component, inject, input } from '@angular/core';
import { TestTextControl } from '../../../types/controls.type';
import { ComponentRegistrationService } from '../../../../lib/services/component-registration.service';
import { FormService } from '../../../../lib/services/form.service';
import { NgxfwAbstractControlDirective } from '../../../../lib';

@Component({
  selector: 'ngxfw-integration-host',
  imports: [NgxfwAbstractControlDirective],
  templateUrl: './registration-integration-host.component.html',
  providers: [FormService],
})
export class RegistrationIntegrationHostComponent {
  private readonly contentRegistrationService = inject(
    ComponentRegistrationService,
  );
  readonly registrations = this.contentRegistrationService.registrations;

  readonly content = input.required<TestTextControl>();
  readonly name = input.required<string>();
}
