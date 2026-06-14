import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  FormConfigEntry,
  isFormbarArray,
  isFormbarBlock,
  isFormbarControl,
  isFormbarGroup,
  NgxFbItem,
} from '@ngx-formbar/core';
import { NgxFbControlDirective } from '../../directives/ngx-fb-control.directive';
import { NgxFbGroupDirective } from '../../directives/ngx-fb-group.directive';
import { NgxFbArrayDirective } from '../../directives/ngx-fb-array.directive';
import { NgxFbBlockDirective } from '../../directives/ngxfb-block.directive';
import { NGXFB_ARRAY_CONTROL } from '../../tokens/control-entries';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'ngxfb-form-array-outlet',
  imports: [
    NgxFbControlDirective,
    NgxFbGroupDirective,
    NgxFbArrayDirective,
    NgxFbBlockDirective,
    ReactiveFormsModule,
  ],
  templateUrl: './ngxfb-form-array-outlet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxFbFormArrayOutlet {
  private readonly context = inject(NGXFB_ARRAY_CONTROL);

  readonly index = input.required<number>();

  readonly entry = computed<FormConfigEntry<NgxFbItem>>(() => ({
    name: String(this.index()),
    config: this.context.rowControl(),
  }));

  protected readonly isFormbarGroup = isFormbarGroup;
  protected readonly isFormbarArray = isFormbarArray;
  protected readonly isFormbarBlock = isFormbarBlock;
  protected readonly isFormbarControl = isFormbarControl;
}
