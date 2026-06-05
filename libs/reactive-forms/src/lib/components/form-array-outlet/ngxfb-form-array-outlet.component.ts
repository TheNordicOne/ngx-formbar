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
import { NgxfbBlockDirective } from '../../directives/ngxfb-block.directive';
import { NGXFB_ARRAY_CONTROL } from '../../tokens/control-entries';
import { ReactiveFormsModule } from '@angular/forms';

/**
 * Renders the controls of a single array row. The consumer's array component
 * owns the row loop and the surrounding markup; it places this outlet once per
 * row, passing the row's `index`. The outlet stamps the matching bind-mode
 * directive so the row's control adopts the existing instance held by the
 * `FormArray` at that index, the same way `<ngxfb-control-outlet />` renders a
 * group's children.
 */
@Component({
  selector: 'ngxfb-form-array-outlet',
  imports: [
    NgxFbControlDirective,
    NgxFbGroupDirective,
    NgxFbArrayDirective,
    NgxfbBlockDirective,
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
