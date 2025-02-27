import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFwFormComponent } from '../../../../lib';
import { NgxFwContent } from '../../../../lib';

@Component({
  selector: 'ngxfw-form-integration-host',
  imports: [ReactiveFormsModule, NgxFwFormComponent],
  templateUrl: './form-integration-host.component.html',
})
export class FormIntegrationHostComponent {
  private readonly formBuilder = inject(FormBuilder);
  readonly formContent = input.required<NgxFwContent[]>();
  readonly formValues = signal<[string, unknown][]>([]);

  form = this.formBuilder.group({});

  reset(){
    this.form.reset();
  }

  patchValue(){
    this.form.patchValue({
      first: 'patched-first',
      second: 'patched-second',
      third: 'patched-third',
      fourth: 'patched-fourth',
      fifth: 'patched-fifth',
    })
  }

  onSubmit(){
    const value = this.form.getRawValue();
    const entries = Object.entries(value)
    this.formValues.set(entries);
  }
}
