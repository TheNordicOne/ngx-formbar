// snippet-from-file="./note-form.ts" "Form Configuration"
// snippet-from-file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/note/note-control.component.ts" "TypeScript"
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';
import { noteForm } from './note-form';

@Component({
  selector: 'docs-note-example',
  imports: [NgxFbFormComponent, ReactiveFormsModule],
  templateUrl: './note-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent = noteForm;

  protected readonly form = this.formBuilder.group({});
}
