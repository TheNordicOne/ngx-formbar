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
import { NgxFbControlDirective } from '../../directives/ngx-fb-control.directive';
import { NgxFbGroupDirective } from '../../directives/ngx-fb-group.directive';
import { NgxfbBlockDirective } from '../../directives/ngxfb-block.directive';
import { NGXFB_CONTROL_ENTRIES } from '../../tokens/control-entries';

@Component({
  selector: 'ngxfb-control-outlet',
  imports: [NgxFbControlDirective, NgxFbGroupDirective, NgxfbBlockDirective],
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
