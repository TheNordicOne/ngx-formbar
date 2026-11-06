// snippet-from-file="./textarea-form.ts" "Form Configuration"
// snippet-from-file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/textarea/textarea-control.component.ts" "TypeScript"
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { textareaForm } from './textarea-form';

@Component({
  selector: 'docs-textarea-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './textarea-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = textareaForm;

  protected readonly form = this.formBuilder.group({});
}
