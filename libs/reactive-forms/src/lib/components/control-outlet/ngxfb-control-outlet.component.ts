import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { NgxfbAbstractControlDirective } from '../../directives/ngxfb-abstract-control.directive';
import { NGXFB_CONTROL_ENTRIES } from '../../tokens/control-entries';

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
  private readonly token = inject(NGXFB_CONTROL_ENTRIES, { optional: true });
  readonly controls = computed(() => this.token?.() ?? []);
}
