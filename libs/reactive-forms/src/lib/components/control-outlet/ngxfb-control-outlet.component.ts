import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  isFormbarArray,
  isFormbarBlock,
  isFormbarControl,
  isFormbarGroup,
} from '@ngx-formbar/core';
import { NgxFbControlDirective } from '../../directives/ngx-fb-control.directive';
import { NgxFbGroupDirective } from '../../directives/ngx-fb-group.directive';
import { NgxFbArrayDirective } from '../../directives/ngx-fb-array.directive';
import { NgxFbBlockDirective } from '../../directives/ngxfb-block.directive';
import { NGXFB_CONTROL_ENTRIES } from '../../tokens/control-entries';

@Component({
  selector: 'ngxfb-control-outlet',
  imports: [
    NgxFbControlDirective,
    NgxFbGroupDirective,
    NgxFbArrayDirective,
    NgxFbBlockDirective,
  ],
  templateUrl: './ngxfb-control-outlet.component.html',
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxFbControlOutlet {
  private readonly token = inject(NGXFB_CONTROL_ENTRIES, { optional: true });
  readonly controls = computed(() => this.token?.() ?? []);

  protected readonly isFormbarGroup = isFormbarGroup;
  protected readonly isFormbarArray = isFormbarArray;
  protected readonly isFormbarBlock = isFormbarBlock;
  protected readonly isFormbarControl = isFormbarControl;
}
