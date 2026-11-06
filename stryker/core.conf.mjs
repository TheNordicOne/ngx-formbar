import { runtimeConfig } from './config.mjs';

export default runtimeConfig(
  'core',
  'libs/core/src/**/*.ts',
  ['@ngx-formbar/core', '@ngx-formbar/reactive-forms'],
  4411,
);
