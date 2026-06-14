import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxfbFormComponent } from '@ngx-formbar/reactive-forms';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

@Component({
  selector: 'docs-group-example',
  imports: [NgxfbFormComponent, ReactiveFormsModule],
  templateUrl: './group-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent: NgxFbForm<ExampleControls> = {
    content: {
      address: {
        type: 'group',
        legend: 'Address',
        controls: {
          street: { type: 'text', label: 'Street' },
          city: { type: 'text', label: 'City' },
        },
      },
    },
  };

  protected readonly form = this.formBuilder.group({});
}
