import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TestTextControlComponent } from '../../../components/test-text-control/test-text-control.component';
import { TestTextControl } from '../../../types/controls.type';
import { FormService } from '../../../../lib/services/form.service';

@Component({
  selector: 'ngxfw-control-integration-host',
  imports: [ReactiveFormsModule, TestTextControlComponent],
  templateUrl: './control-integration-host.component.html',
  providers: [FormService],
})
export class ControlIntegrationHostComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly content = input.required<TestTextControl>();
  readonly name = input.required<string>();

  form = this.formBuilder.group({});
}
