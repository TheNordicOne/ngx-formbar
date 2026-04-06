import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';
import { TextareaControl } from '@ngx-formbar/examples';
import { viewProviders } from '../../helpers';

@Component({
  selector: 'ngxfb-examples-textarea-control',
  imports: [ReactiveFormsModule],
  templateUrl: './textarea-control.component.html',
  styleUrl: './textarea-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class TextareaControlComponent
  implements ReactiveFormbarControl<TextareaControl>
{
  readonly name = input.required<string>();
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly hidden = input(false);
  readonly label = input('');
  readonly testId = input('');
  readonly rows = input<number>();
  readonly maxLength = input<number>();
  readonly placeHolder = input<string>();
}
