import { InjectionToken, Signal } from '@angular/core';
import { FormConfigEntry, NgxFbItem } from '@ngx-formbar/core';

export const NGXFB_CONTROL_ENTRIES = new InjectionToken<
  Signal<FormConfigEntry<NgxFbItem>[]>
>('ngxfb-control-entries');
