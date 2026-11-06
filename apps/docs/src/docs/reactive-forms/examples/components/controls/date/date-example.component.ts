// snippet-from-file="./date-form.ts" "Form Configuration"
// snippet-from-file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/date/date-control.component.ts" "TypeScript"
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { dateForm } from './date-form';

@Component({
  selector: 'docs-date-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './date-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = dateForm;

  protected readonly form = this.formBuilder.group({});
}
