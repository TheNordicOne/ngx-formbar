import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxfbFormComponent } from '@ngx-formbar/reactive-forms';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

@Component({
  selector: 'docs-date-example',
  imports: [NgxfbFormComponent, ReactiveFormsModule],
  templateUrl: './date-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent: NgxFbForm<ExampleControls> = {
    content: {
      preferredDate: {
        type: 'date',
        label: 'Preferred Date',
        minDate: '1900-01-01',
        maxDate: '2026-12-31',
      },
    },
  };

  protected readonly form = this.formBuilder.group({});
}
