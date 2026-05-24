import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import {
  NgxfbControlOutlet,
  ReactiveFormbarControl,
} from '@ngx-formbar/reactive-forms';
import { viewProviders } from '../../helpers';
import { ValidationErrorsComponent } from '../validation-errors/validation-errors.component';
import { ArrayControl } from '../../../../../src/lib/types/array-control.type';

@Component({
  selector: 'ngxfb-examples-array-control',
  imports: [ReactiveFormsModule, ValidationErrorsComponent, NgxfbControlOutlet],
  templateUrl: './array-control.component.html',
  styleUrl: './array-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class ArrayControlComponent
  implements ReactiveFormbarControl<ArrayControl>
{
  readonly name = input.required<string>();
  readonly isDisabled = input(false);
  readonly isReadonly = input(false);
  readonly isHidden = input(false);
  readonly labelText = input<string | undefined>('');
  readonly dynamicLabel = input<string | null>();
  readonly testId = input('');
  readonly errors = input<ValidationErrors | null>(null);
  readonly isDirty = input(false);

  readonly displayLabel = computed(() => {
    const dynamic = this.dynamicLabel();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }
    return this.labelText();
  });
}
