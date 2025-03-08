import { Component, inject, input } from '@angular/core';
import { NgxFwContent } from '../../types/content.type';
import { ContentHostComponent } from '../content-host/content-host.component';
import { ComponentRegistrationService } from '../../services/component-registration.service';

@Component({
  selector: 'ngxfw-form',
  imports: [ContentHostComponent],
  templateUrl: './ngx-fw-form.component.html',
})
export class NgxFwFormComponent {
  private readonly contentRegistrationService = inject(
    ComponentRegistrationService,
  );
  readonly registrations = this.contentRegistrationService.registrations;

  readonly formContent = input.required<NgxFwContent[]>();
}
