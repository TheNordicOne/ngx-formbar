import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

@Component({
  selector: 'docs-checkbox-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './checkbox-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent: NgxFbForm<ExampleControls> = {
    content: {
      agree: {
        type: 'checkbox',
        label: 'Power loss present',
      },
    },
  };

  protected readonly form = this.formBuilder.group({});
}
