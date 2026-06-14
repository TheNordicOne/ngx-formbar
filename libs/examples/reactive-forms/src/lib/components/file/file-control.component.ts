import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';
import { FileControl } from '@ngx-formbar/examples';
import { viewProviders } from '../../helpers';
import { FileInputDirective } from './file-input.directive';

@Component({
  selector: 'ngxfb-examples-file-control',
  imports: [ReactiveFormsModule, FileInputDirective],
  templateUrl: './file-control.component.html',
  styleUrl: './file-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class FileControlComponent
  implements ReactiveFormbarControl<FileControl>
{
  readonly name = input.required<string>();
  readonly isDisabled = input(false);
  readonly isReadonly = input(false);
  readonly isHidden = input(false);
  readonly labelText = input<string | undefined>('');
  readonly dynamicLabel = input<string | null>();
  readonly testId = input('');
  readonly multiple = input<boolean>();
  readonly accept = input<string[]>();

  readonly displayLabel = computed(() => {
    const dynamic = this.dynamicLabel();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }
    return this.labelText();
  });
}
