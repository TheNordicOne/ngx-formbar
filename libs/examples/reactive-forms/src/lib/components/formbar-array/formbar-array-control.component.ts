import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { NGXFB_ARRAY_CONTROL, NgxFbFormArrayOutlet, ReactiveFormbarArray } from '@ngx-formbar/reactive-forms';
import { ArrayControl } from '@ngx-formbar/examples';
import { viewProviders } from '../../helpers';
import { ValidationErrorsComponent } from '../validation-errors/validation-errors.component';

@Component({
  selector: 'ngxfb-examples-formbar-array-control',
  imports: [ReactiveFormsModule, NgxFbFormArrayOutlet, ValidationErrorsComponent],
  templateUrl: './formbar-array-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class FormbarArrayControlComponent
  implements ReactiveFormbarArray<ArrayControl>
{
  protected readonly array = inject(NGXFB_ARRAY_CONTROL);

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
  readonly addLabel = input<string>();
  readonly itemLabel = input<string>();
  readonly emptyMessage = input<string>();

  readonly displayLabel = computed(() => {
    const dynamic = this.dynamicLabel();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }
    return this.labelText();
  });
}
