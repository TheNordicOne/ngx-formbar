import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFwFormComponent } from '../../../../lib';
import { NgxFwContent } from '../../../../lib/types/content.type';

@Component({
  selector: 'ngxfw-form-integration-host',
  imports: [ReactiveFormsModule, NgxFwFormComponent],
  templateUrl: './form-integration-host.component.html',
})
export class FormIntegrationHostComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly formContent = input.required<NgxFwContent[]>();

  form = this.formBuilder.group({});
}
