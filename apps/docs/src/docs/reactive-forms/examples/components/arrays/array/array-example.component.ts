import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxfbFormComponent } from '@ngx-formbar/reactive-forms';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

@Component({
  selector: 'docs-array-example',
  imports: [NgxfbFormComponent, ReactiveFormsModule],
  templateUrl: './array-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrayExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent: NgxFbForm<ExampleControls> = {
    content: {
      tags: {
        type: 'array',
        label: 'Tags',
        addLabel: 'Add tag',
        itemLabel: 'tag',
        emptyMessage: 'No tags yet.',
        rowControl: { type: 'text', label: 'Tag' },
      },
    },
  };

  protected readonly form = this.formBuilder.group({});
}
