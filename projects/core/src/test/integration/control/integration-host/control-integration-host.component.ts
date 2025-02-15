import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TestTextControlComponent } from '../../../components/test-text-control/test-text-control.component';
import { TestTextControl } from '../../../types/controls.type';

@Component({
  selector: 'ngxfw-control-integration-host',
  imports: [ReactiveFormsModule, TestTextControlComponent],
  templateUrl: './control-integration-host.component.html',
})
export class ControlIntegrationHostComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly content = input.required<TestTextControl>();

  form = this.formBuilder.group({});
}
