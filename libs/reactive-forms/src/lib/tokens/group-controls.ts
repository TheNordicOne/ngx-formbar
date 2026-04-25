import { InjectionToken, Signal } from '@angular/core';
import { NgxFbContent } from '@ngx-formbar/core';

export const NGXFB_GROUP_CONTROLS = new InjectionToken<
  Signal<[string, NgxFbContent][]>
>('ngxfb-group-controls');
