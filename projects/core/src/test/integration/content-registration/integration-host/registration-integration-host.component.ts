import { Component, inject, input } from '@angular/core';
import { TestTextControl } from '../../../types/controls.type';
import { FormService } from '../../../../lib/services/form.service';
import {
  NGX_FW_COMPONENT_RESOLVER,
  NgxfwAbstractControlDirective,
} from '../../../../lib';

@Component({
  selector: 'ngxfw-integration-host',
  imports: [NgxfwAbstractControlDirective],
  templateUrl: './registration-integration-host.component.html',
  providers: [FormService],
})
export class RegistrationIntegrationHostComponent {
  private readonly contentRegistrationService = inject(
    NGX_FW_COMPONENT_RESOLVER,
  );
  readonly registrations = this.contentRegistrationService.registrations;

  readonly content = input.required<TestTextControl>();
  readonly name = input.required<string>();
}
