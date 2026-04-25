import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  isFormbarBlock,
  isFormbarControl,
  isFormbarGroup,
} from '@ngx-formbar/core';
import { NgxfbControlDirective } from '../../directives/ngxfb-control.directive';
import { NgxfbGroupDirective } from '../../directives/ngxfb-group.directive';
import { NgxfbBlockDirective } from '../../directives/ngxfb-block.directive';
import { NGXFB_CONTROL_ENTRIES } from '../../tokens/control-entries';

@Component({
  selector: 'ngxfb-control-outlet',
  imports: [NgxfbControlDirective, NgxfbGroupDirective, NgxfbBlockDirective],
  templateUrl: './ngxfb-control-outlet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxfbControlOutlet {
  private readonly token = inject(NGXFB_CONTROL_ENTRIES, { optional: true });
  readonly controls = computed(() => this.token?.() ?? []);

  protected readonly isFormbarGroup = isFormbarGroup;
  protected readonly isFormbarBlock = isFormbarBlock;
  protected readonly isFormbarControl = isFormbarControl;
}
