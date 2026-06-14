import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';
import { TextControl } from '@ngx-formbar/examples';
import { viewProviders } from '../../helpers';
import { ValidationErrorsComponent } from '../validation-errors/validation-errors.component';

@Component({
  selector: 'ngxfb-examples-text-control',
  imports: [ReactiveFormsModule, ValidationErrorsComponent],
  templateUrl: './text-control.component.html',
  styleUrl: './text-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class TextControlComponent
  implements ReactiveFormbarControl<TextControl>
{
  // Contract inputs. Formbar resolves these for you.
  readonly name = input.required<string>();
  readonly isDisabled = input(false);
  readonly isReadonly = input(false);
  readonly isHidden = input(false);
  readonly labelText = input<string | undefined>('');
  readonly dynamicLabel = input<string | null>();
  readonly testId = input('');
  readonly errors = input<ValidationErrors | null>(null);
  readonly isDirty = input(false);

  // Custom inputs. Formbar passes these straight from your config.
  readonly hint = input<string>();
  readonly placeHolder = input<string>();

  readonly displayLabel = computed(() => {
    const dynamic = this.dynamicLabel();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }
    return this.labelText();
  });
}
