// snippet-from-file="./group-form.ts" "Form Configuration"
// snippet-from-file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/group/group-control.component.ts" "TypeScript"
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { groupForm } from './group-form';

@Component({
  selector: 'docs-group-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './group-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = groupForm;

  protected readonly form = this.formBuilder.group({});
}
