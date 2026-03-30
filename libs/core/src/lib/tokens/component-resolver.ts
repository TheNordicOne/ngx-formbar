import { InjectionToken } from '@angular/core';
import { ComponentResolver } from '../types/component-resolver.type';

export const NGX_FW_COMPONENT_RESOLVER = new InjectionToken<ComponentResolver>(
  'NGX_FW_COMPONENT_RESOLVER',
);
