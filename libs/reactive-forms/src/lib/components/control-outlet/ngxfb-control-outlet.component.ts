import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { NgxfbAbstractControlDirective } from '../../directives/ngxfb-abstract-control.directive';
import { NGXFB_GROUP_CONTROLS } from '../../tokens/group-controls';

@Component({
  selector: 'ngxfb-control-outlet',
  imports: [NgxfbAbstractControlDirective],
  template: `
    @for (entry of controls(); track entry[0]) {
      <ng-template *ngxfbAbstractControl="entry" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxfbControlOutlet {
  private readonly token = inject(NGXFB_GROUP_CONTROLS, { optional: true });
  readonly controls = computed(() => this.token?.() ?? []);
}
