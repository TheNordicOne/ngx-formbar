import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxfbFormComponent } from '@ngx-formbar/reactive-forms';
import { complexMaintenanceForm } from '../../../app/examples/forms/complex-maintenance-form';

@Component({
  selector: 'docs-complex-demo',
  imports: [NgxfbFormComponent, ReactiveFormsModule],
  templateUrl: './complex-demo.component.html',
  styleUrl: '../demo.styles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplexDemoComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = complexMaintenanceForm;
  protected readonly form = this.formBuilder.group({});

  protected onSubmit(event: Event) {
    event.preventDefault();
    console.log('form.value', this.form.value);
  }

  protected reset() {
    this.form.reset();
  }
}
