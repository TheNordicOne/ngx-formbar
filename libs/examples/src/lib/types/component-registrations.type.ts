import { Type } from '@angular/core';
import { ComponentRegistrationConfig } from '@ngx-formbar/core';

export interface ComponentRegistrations extends ComponentRegistrationConfig {
  text: Type<unknown>;
  number: Type<unknown>;
  checkbox: Type<unknown>;
  radio: Type<unknown>;
  dropdown: Type<unknown>;
  group: Type<unknown>;
  note: Type<unknown>;
  textarea: Type<unknown>;
  date: Type<unknown>;
  file: Type<unknown>;
}
