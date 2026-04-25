import { InjectionToken, Signal } from '@angular/core';
import { NgxFbContent } from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';

export const NGXFB_CONTROL_ENTRIES = new InjectionToken<
  Signal<FormConfigEntry<NgxFbContent>[]>
>('ngxfb-control-entries');
