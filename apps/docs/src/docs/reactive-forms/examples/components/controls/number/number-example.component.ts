import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

@Component({
  selector: 'docs-number-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './number-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent: NgxFbForm<ExampleControls> = {
    content: {
      peopleAffected: {
        type: 'number',
        label: 'People Affected',
        min: 0,
        max: 5000,
      },
    },
  };

  protected readonly form = this.formBuilder.group({});
}
