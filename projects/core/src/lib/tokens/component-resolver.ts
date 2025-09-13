import { InjectionToken } from '@angular/core';
import { ComponentResolver } from '../types/component-resolver.type';

export const NgxFwComponentResolver = new InjectionToken<ComponentResolver>(
  'NgxFwComponentResolver',
);
