import { Component, inject, input } from '@angular/core';
import { ContentHostComponent } from '../../../../lib/features/form/components/content-host/content-host.component';
import { TestTextControl } from '../../../types/controls.type';
import { ContentRegistrationService } from '../../../../lib/features/form/services/content-registration.service';

@Component({
  selector: 'ngxfw-integration-host',
  imports: [ContentHostComponent],
  templateUrl: './integration-host.component.html',
})
export class IntegrationHostComponent {
  private readonly contentRegistrationService = inject(
    ContentRegistrationService,
  );
  readonly registrations = this.contentRegistrationService.registrations;

  readonly content = input.required<TestTextControl>();
}
