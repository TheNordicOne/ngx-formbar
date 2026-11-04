import { schematicsConfig } from './config.mjs';

export default schematicsConfig('setup', 'libs/setup/src/**/*.ts', {
  schematics: true,
  ngAdd: true,
});
