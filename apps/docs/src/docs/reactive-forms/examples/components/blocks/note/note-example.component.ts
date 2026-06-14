import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgxfbFormComponent } from '@ngx-formbar/reactive-forms';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';

@Component({
  selector: 'docs-note-example',
  imports: [NgxfbFormComponent, ReactiveFormsModule],
  templateUrl: './note-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteExampleComponent {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly formContent: NgxFbForm<ExampleControls> = {
    content: {
      infoNote: {
        type: 'note',
        isControl: false,
        severity: 'info',
        message: 'An informational note rendered as a block.',
      },
    },
  };

  protected readonly form = this.formBuilder.group({});
}
