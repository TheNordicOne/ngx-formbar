import { Component, inject, input } from '@angular/core';
import { NgxFwContent } from '../../types/content.type';
import { ContentHostComponent } from '../content-host/content-host.component';
import { ContentRegistrationService } from '../../services/content-registration.service';

@Component({
  selector: 'ngxfw-form',
  imports: [ContentHostComponent],
  templateUrl: './ngx-fw-form.component.html',
})
export class NgxFwFormComponent {
  private readonly contentRegistrationService = inject(
    ContentRegistrationService,
  );
  readonly registrations = this.contentRegistrationService.registrations;

  readonly formContent = input.required<NgxFwContent[]>();
}
