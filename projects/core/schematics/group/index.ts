import { chain, Rule } from '@angular-devkit/schematics';
import { scaffoldAndRegister } from '../shared/rules';
import { Schema } from '../shared/schema';

export function group(options: Schema): Rule {
  return () => {
    return chain([scaffoldAndRegister(options, 'group')]);
  };
}
