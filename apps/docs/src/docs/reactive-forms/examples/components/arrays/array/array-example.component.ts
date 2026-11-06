// snippet-from-file="./array-form.ts" "Form Configuration"
// snippet-from-file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/array/array-control.component.ts" "TypeScript"
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { arrayForm } from './array-form';

@Component({
  selector: 'docs-array-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './array-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrayExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = arrayForm;

  protected readonly form = this.formBuilder.group({});
}
