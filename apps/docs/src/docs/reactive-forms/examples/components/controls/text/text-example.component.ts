// snippet-from-file="./text-form.ts" "Form Configuration"
// snippet-from-file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/text/text-control.component.ts" "TypeScript"
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { textForm } from './text-form';

@Component({
  selector: 'docs-text-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './text-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = textForm;

  protected readonly form = this.formBuilder.group({});
}
