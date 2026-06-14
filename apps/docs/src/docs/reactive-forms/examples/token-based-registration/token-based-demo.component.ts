import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { maintenanceForm } from '@ngx-formbar/examples';

@Component({
  selector: 'docs-token-based-demo',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './token-based-demo.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenBasedDemoComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = maintenanceForm;
  protected readonly form = this.formBuilder.group({});

  protected onSubmit(event: Event): void {
    event.preventDefault();
    console.log('form.value', this.form.value);
  }

  protected reset(): void {
    this.form.reset();
  }
}
