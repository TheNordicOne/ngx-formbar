import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

@Component({
  selector: 'docs-textarea-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './textarea-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent: NgxFbForm<ExampleControls> = {
    content: {
      description: {
        type: 'textarea',
        label: 'Description',
        placeHolder: 'Describe the issue',
        rows: 4,
        maxLength: 500,
      },
    },
  };

  protected readonly form = this.formBuilder.group({});
}
