import { InjectionToken, Signal } from '@angular/core';
import { NgxFbContent } from '@ngx-formbar/core';

export const NGXFB_CONTROL_ENTRIES = new InjectionToken<
  Signal<[string, NgxFbContent][]>
>('ngxfb-control-entries');
