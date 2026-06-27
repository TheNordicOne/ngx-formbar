import { chain, Rule } from '@angular-devkit/schematics';
import { scaffoldAndRegister } from '../shared/rules/scaffold-and-register.rule';
import { Schema } from '../shared/schema';

export function array(options: Schema): Rule {
  return () => {
    return chain([scaffoldAndRegister(options, 'array')]);
  };
}
