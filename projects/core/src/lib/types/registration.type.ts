import { Type } from '@angular/core';

export type ComponentRegistrationConfig = {
  type: string;
  component: Type<unknown>;
};

export type StateHandling = 'auto' | 'manual';
