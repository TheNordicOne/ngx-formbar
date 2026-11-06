// snippet-from-file="./checkbox-form.ts" "Form Configuration"
// snippet-from-file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/checkbox/checkbox-control.component.ts" "TypeScript"
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { checkboxForm } from './checkbox-form';

@Component({
  selector: 'docs-checkbox-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './checkbox-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = checkboxForm;

  protected readonly form = this.formBuilder.group({});
}
