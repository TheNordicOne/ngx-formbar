import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import {
  NgxfbControlOutlet,
  ReactiveFormbarGroup,
} from '@ngx-formbar/reactive-forms';
import { GroupControl } from '@ngx-formbar/examples';
import { viewProviders } from '../../helpers';
import { ValidationErrorsComponent } from '../validation-errors/validation-errors.component';

@Component({
  selector: 'ngxfb-examples-group-control',
  imports: [ReactiveFormsModule, NgxfbControlOutlet, ValidationErrorsComponent],
  templateUrl: './group-control.component.html',
  styleUrl: './group-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class GroupControlComponent
  implements ReactiveFormbarGroup<GroupControl>
{
  readonly name = input.required<string>();
  readonly isDisabled = input(false);
  readonly isReadonly = input(false);
  readonly isHidden = input(false);
  readonly titleText = input('');
  readonly dynamicTitle = input<string>();
  readonly testId = input('');
  readonly legend = input<string>();
  readonly errors = input<ValidationErrors | null>(null);
  readonly isDirty = input(false);

  readonly displayTitle = computed(() => {
    const dynamic = this.dynamicTitle();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }
    return this.titleText() || (this.legend() ?? '');
  });
}
