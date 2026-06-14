import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

@Component({
  selector: 'docs-file-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './file-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent: NgxFbForm<ExampleControls> = {
    content: {
      attachment: {
        type: 'file',
        label: 'Attachment',
        accept: ['.pdf', '.txt'],
      },
    },
  };

  protected readonly form = this.formBuilder.group({});
}
