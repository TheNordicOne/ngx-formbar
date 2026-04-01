import {
  ComponentRegistrationConfig,
  LoadComponentFn,
} from '@ngx-formbar/core';

export interface ComponentRegistrations extends ComponentRegistrationConfig {
  text: LoadComponentFn;
  number: LoadComponentFn;
  checkbox: LoadComponentFn;
  radio: LoadComponentFn;
  dropdown: LoadComponentFn;
  group: LoadComponentFn;
  note: LoadComponentFn;
  textarea: LoadComponentFn;
  date: LoadComponentFn;
  file: LoadComponentFn;
}
