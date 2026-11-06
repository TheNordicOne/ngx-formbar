// snippet-from-file="./radio-form.ts" "Form Configuration"
// snippet-from-file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/radio/radio-control.component.ts" "TypeScript"
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { radioForm } from './radio-form';

@Component({
  selector: 'docs-radio-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './radio-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = radioForm;

  protected readonly form = this.formBuilder.group({});
}
