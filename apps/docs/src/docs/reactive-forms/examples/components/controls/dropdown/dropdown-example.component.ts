// snippet-from-file="./dropdown-form.ts" "Form Configuration"
// snippet-from-file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/dropdown/dropdown-control.component.ts" "TypeScript"
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { dropdownForm } from './dropdown-form';

@Component({
  selector: 'docs-dropdown-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './dropdown-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = dropdownForm;

  protected readonly form = this.formBuilder.group({});
}
