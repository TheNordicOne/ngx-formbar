import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbForm } from '@ngx-formbar/core';
import { NgxfbFormComponent } from '@ngx-formbar/reactive-forms';
import {
  maintenanceFormLarge,
  highlyComputedForm,
  ExampleControls,
} from '@ngx-formbar/examples';

@Component({
  selector: 'docs-very-large-form-demo',
  imports: [NgxfbFormComponent, ReactiveFormsModule],
  templateUrl: './very-large-form-demo.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VeryLargeFormDemoComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected formContent: NgxFbForm<ExampleControls> = maintenanceFormLarge;
  protected readonly form = this.formBuilder.group({});

  protected useForm(key: 'maintenance' | 'computed') {
    this.formContent =
      key === 'computed' ? highlyComputedForm : maintenanceFormLarge;
  }

  protected onSubmit(event: Event) {
    event.preventDefault();
    console.log('form.value', this.form.value);
  }

  protected reset() {
    this.form.reset();
  }
}
