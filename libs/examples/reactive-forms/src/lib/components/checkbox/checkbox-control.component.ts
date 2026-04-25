import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';
import { CheckboxControl } from '@ngx-formbar/examples';
import { viewProviders } from '../../helpers';

@Component({
  selector: 'ngxfb-examples-checkbox-control',
  imports: [ReactiveFormsModule],
  templateUrl: './checkbox-control.component.html',
  styleUrl: './checkbox-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class CheckboxControlComponent
  implements ReactiveFormbarControl<CheckboxControl>
{
  readonly name = input.required<string>();
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly hidden = input(false);
  readonly label = input('');
  readonly dynamicLabel = input<string>();
  readonly testId = input('');

  readonly displayLabel = computed(() => {
    const dynamic = this.dynamicLabel();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }
    return this.label();
  });
}
