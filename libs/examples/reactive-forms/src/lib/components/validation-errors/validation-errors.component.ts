import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import type { ValidationErrors } from '@angular/forms';

@Component({
  selector: 'ngxfb-examples-validation-errors',
  imports: [KeyValuePipe],
  templateUrl: './validation-errors.component.html',
  styleUrl: './validation-errors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.display]': "visible() ? null : 'none'",
  },
})
export class ValidationErrorsComponent {
  readonly errors = input<ValidationErrors | null>({});
  readonly testId = input.required<string>();
  readonly dirty = input.required<boolean>();

  // Collapse the host entirely when there is nothing to show so it never
  // occupies a grid row or adds spacing below a field.
  protected readonly visible = computed(() => {
    const errors = this.errors();
    return this.dirty() && !!errors && Object.keys(errors).length > 0;
  });
}
