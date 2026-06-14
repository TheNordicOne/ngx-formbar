import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxfbFormComponent } from '@ngx-formbar/reactive-forms';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

@Component({
  selector: 'docs-dropdown-example',
  imports: [NgxfbFormComponent, ReactiveFormsModule],
  templateUrl: './dropdown-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent: NgxFbForm<ExampleControls> = {
    content: {
      country: {
        type: 'dropdown',
        label: 'Country',
        options: [
          { id: 'us', value: 'us', label: 'United States' },
          { id: 'uk', value: 'uk', label: 'United Kingdom' },
          { id: 'de', value: 'de', label: 'Germany' },
        ],
      },
    },
  };

  protected readonly form = this.formBuilder.group({});
}
