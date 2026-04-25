import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';
import { DropdownControl } from '@ngx-formbar/examples';
import { viewProviders } from '../../helpers';

@Component({
  selector: 'ngxfb-examples-dropdown-control',
  imports: [ReactiveFormsModule],
  templateUrl: './dropdown-control.component.html',
  styleUrl: './dropdown-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class DropdownControlComponent
  implements ReactiveFormbarControl<DropdownControl>
{
  readonly name = input.required<string>();
  readonly isDisabled = input(false);
  readonly isReadonly = input(false);
  readonly isHidden = input(false);
  readonly labelText = input('');
  readonly dynamicLabel = input<string>();
  readonly testId = input('');
  readonly options = input.required<{ id: string; value: string; label: string }[]>();

  readonly displayLabel = computed(() => {
    const dynamic = this.dynamicLabel();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }
    return this.labelText();
  });
}
