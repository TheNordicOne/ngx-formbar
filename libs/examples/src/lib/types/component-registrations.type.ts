import {
  ComponentRegistrationConfig,
  ComponentRegistrationEntry,
} from '@ngx-formbar/core';

export interface ComponentRegistrations extends ComponentRegistrationConfig {
  text: ComponentRegistrationEntry;
  number: ComponentRegistrationEntry;
  checkbox: ComponentRegistrationEntry;
  radio: ComponentRegistrationEntry;
  dropdown: ComponentRegistrationEntry;
  group: ComponentRegistrationEntry;
  note: ComponentRegistrationEntry;
  textarea: ComponentRegistrationEntry;
  date: ComponentRegistrationEntry;
  file: ComponentRegistrationEntry;
}
