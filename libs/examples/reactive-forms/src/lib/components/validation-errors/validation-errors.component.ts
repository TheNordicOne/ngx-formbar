import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import type { ValidationErrors } from '@angular/forms';

@Component({
  selector: 'ngxfb-examples-validation-errors',
  imports: [KeyValuePipe],
  templateUrl: './validation-errors.component.html',
  styleUrl: './validation-errors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationErrorsComponent {
  readonly errors = input<ValidationErrors | null>({});
  readonly testId = input.required<string>();
}
