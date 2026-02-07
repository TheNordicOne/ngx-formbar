import { InjectionToken } from '@angular/core';
import { UpdateStrategy } from '@ngx-formbar/core';

export const NGX_FW_DEFAULT_UPDATE_STRATEGY =
  new InjectionToken<UpdateStrategy>('NGX_FW_DEFAULT_UPDATE_STRATEGY', {
    providedIn: 'root',
    factory: () => 'change',
  });
