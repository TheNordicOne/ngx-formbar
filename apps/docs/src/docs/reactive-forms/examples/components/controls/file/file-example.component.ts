// snippet-from-file="./file-form.ts" "Form Configuration"
// snippet-from-file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/file/file-control.component.ts" "TypeScript"
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { fileForm } from './file-form';

@Component({
  selector: 'docs-file-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './file-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = fileForm;

  protected readonly form = this.formBuilder.group({});
}
