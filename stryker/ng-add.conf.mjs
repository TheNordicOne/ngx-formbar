import { schematicsConfig } from './config.mjs';

export default schematicsConfig(
  'ng-add',
  'libs/reactive-forms/schematics/**/*.ts',
  { ngAdd: true },
);
