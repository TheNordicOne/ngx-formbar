import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';
import { TextControl } from '@ngx-formbar/examples';
import { viewProviders } from '../../helpers';

@Component({
  selector: 'ngxfb-examples-text-control',
  imports: [ReactiveFormsModule],
  templateUrl: './text-control.component.html',
  styleUrl: './text-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class TextControlComponent
  implements ReactiveFormbarControl<TextControl>
{
  readonly name = input.required<string>();
  readonly isDisabled = input(false);
  readonly isReadonly = input(false);
  readonly isHidden = input(false);
  readonly labelText = input('');
  readonly dynamicLabel = input<string>();
  readonly testId = input('');
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
