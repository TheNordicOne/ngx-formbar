import { Type } from '@angular/core';

export type RegistrationConfig = {
  type: string;
  component: Type<unknown>;
};
