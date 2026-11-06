// snippet-from-file="./number-form.ts" "Form Configuration"
// snippet-from-file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/number/number-control.component.ts" "TypeScript"
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { numberForm } from './number-form';

@Component({
  selector: 'docs-number-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './number-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = numberForm;

  protected readonly form = this.formBuilder.group({});
}
