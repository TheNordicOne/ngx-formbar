import { Component, inject, input } from '@angular/core';
import { TestTextControl } from '../../../types/controls.type';
import { FormService } from '../../../../lib/services/form.service';
import { NgxfwAbstractControlDirective } from '../../../../lib';
import { NgxFwComponentResolver } from '../../../../lib/tokens/component-resolver';

@Component({
  selector: 'ngxfw-integration-host',
  imports: [NgxfwAbstractControlDirective],
  templateUrl: './registration-integration-host.component.html',
  providers: [FormService],
})
export class RegistrationIntegrationHostComponent {
  private readonly contentRegistrationService = inject(NgxFwComponentResolver);
  readonly registrations = this.contentRegistrationService.registrations;

  readonly content = input.required<TestTextControl>();
  readonly name = input.required<string>();
}
