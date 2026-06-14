import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxfbFormComponent } from '@ngx-formbar/reactive-forms';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

@Component({
  selector: 'docs-radio-example',
  imports: [NgxfbFormComponent, ReactiveFormsModule],
  templateUrl: './radio-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent: NgxFbForm<ExampleControls> = {
    content: {
      urgency: {
        type: 'radio',
        label: 'Urgency',
        options: [
          { id: 'low', value: 'low', label: 'Low' },
          { id: 'high', value: 'high', label: 'High' },
        ],
      },
    },
  };

  protected readonly form = this.formBuilder.group({});
}
