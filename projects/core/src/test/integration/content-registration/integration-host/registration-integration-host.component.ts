import { Component, inject, input } from '@angular/core';
import { ContentHostComponent } from '../../../../lib/components/content-host/content-host.component';
import { TestTextControl } from '../../../types/controls.type';
import { ComponentRegistrationService } from '../../../../lib/services/component-registration.service';
import { FormService } from '../../../../lib/services/form.service';

@Component({
  selector: 'ngxfw-integration-host',
  imports: [ContentHostComponent],
  templateUrl: './registration-integration-host.component.html',
  providers: [FormService],
})
export class RegistrationIntegrationHostComponent {
  private readonly contentRegistrationService = inject(
    ComponentRegistrationService,
  );
  readonly registrations = this.contentRegistrationService.registrations;

  readonly content = input.required<TestTextControl>();
}
