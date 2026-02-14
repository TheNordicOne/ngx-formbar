import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxfbFormComponent } from '@ngx-formbar/reactive-forms';
import { maintenanceForm } from '../../../app/examples/forms/maintenance-form';

@Component({
  selector: 'docs-config-based-demo',
  imports: [NgxfbFormComponent, ReactiveFormsModule],
  templateUrl: './config-based-demo.component.html',
  styleUrl: '../demo.styles.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigBasedDemoComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = maintenanceForm;
  protected readonly form = this.formBuilder.group({});

  protected onSubmit(event: Event) {
    event.preventDefault();
    console.log('form.value', this.form.value);
  }

  protected reset() {
    this.form.reset();
  }
}
