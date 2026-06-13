import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';
import { ManualTextControl } from '@ngx-formbar/examples';
import { viewProviders } from '../../helpers';

/**
 * A text control that handles its own visibility.
 *
 * Registered with `hiddenHandling: 'manual'`. The library does not
 * manage hiding, form model removal, or value strategy for this component.
 * The component reads `isHidden` and decides what to render.
 */
@Component({
  selector: 'ngxfb-examples-manual-text-control',
  imports: [ReactiveFormsModule],
  templateUrl: './manual-text-control.component.html',
  styleUrl: './manual-text-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class ManualTextControlComponent
  implements ReactiveFormbarControl<ManualTextControl>
{
  readonly name = input.required<string>();
  readonly isDisabled = input(false);
  readonly isReadonly = input(false);
  readonly isHidden = input(false);
  readonly labelText = input<string | undefined>('');
  readonly dynamicLabel = input<string | null>();
  readonly testId = input('');

  readonly displayLabel = computed(() => {
    const dynamic = this.dynamicLabel();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }
    return this.labelText();
  });
}
