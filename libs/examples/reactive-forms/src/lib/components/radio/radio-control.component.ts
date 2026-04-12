import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';
import { RadioControl } from '@ngx-formbar/examples';
import { viewProviders } from '../../helpers';

@Component({
  selector: 'ngxfb-examples-radio-control',
  imports: [ReactiveFormsModule],
  templateUrl: './radio-control.component.html',
  styleUrl: './radio-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class RadioControlComponent
  implements ReactiveFormbarControl<RadioControl>
{
  readonly name = input.required<string>();
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly hidden = input(false);
  readonly label = input('');
  readonly testId = input('');
  readonly options =
    input.required<{ id: string; value: string; label: string }[]>();
}
