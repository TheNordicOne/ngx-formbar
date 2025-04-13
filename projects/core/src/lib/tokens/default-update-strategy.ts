import { InjectionToken } from '@angular/core';
import { UpdateStrategy } from '../types/content.type';

export const DefaultUpdateStrategy = new InjectionToken<
  UpdateStrategy | undefined
>('DefaultUpdateStrategy');
