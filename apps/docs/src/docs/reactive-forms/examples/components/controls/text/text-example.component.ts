import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

@Component({
  selector: 'docs-text-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './text-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent: NgxFbForm<ExampleControls> = {
    content: {
      fullName: {
        type: 'text',
        label: 'Full Name',
        placeHolder: 'e.g., Emma Frost',
      },
    },
  };

  protected readonly form = this.formBuilder.group({});
}
