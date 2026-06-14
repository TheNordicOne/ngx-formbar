import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import {
  NgxFbControlOutlet,
  ReactiveFormbarGroup,
} from '@ngx-formbar/reactive-forms';
import { GroupControl } from '@ngx-formbar/examples';
import { viewProviders } from '../../helpers';
import { ValidationErrorsComponent } from '../validation-errors/validation-errors.component';

@Component({
  selector: 'ngxfb-examples-formbar-group-control',
  imports: [ReactiveFormsModule, NgxFbControlOutlet, ValidationErrorsComponent],
  templateUrl: './formbar-group-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class FormbarGroupControlComponent
  implements ReactiveFormbarGroup<GroupControl>
{
  // Contract inputs. Formbar resolves these for you.
  readonly name = input.required<string>();
  readonly isDisabled = input(false);
  readonly isReadonly = input(false);
  readonly isHidden = input(false);
  readonly titleText = input<string | undefined>('');
  readonly dynamicTitle = input<string | null>();
  readonly testId = input('');
  readonly errors = input<ValidationErrors | null>(null);
  readonly isDirty = input(false);

  // Custom inputs. Formbar passes these straight from your config.
  readonly legend = input<string>();

  readonly displayTitle = computed(() => {
    const dynamic = this.dynamicTitle();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }
    return this.titleText() ?? this.legend() ?? '';
  });
}
