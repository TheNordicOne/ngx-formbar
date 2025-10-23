import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';

import { discoverComponents } from './discover-components';
import { DiscoverOptions, RegisterContext } from './schema';
import { registerComponents } from './register-components';

export function register(options: DiscoverOptions): Rule {
  let registerContext: RegisterContext | undefined;

  const discover: Rule = (tree: Tree, context: SchematicContext) => {
    registerContext = discoverComponents(tree, options, context);
    return tree;
  };

  const register: Rule = (tree: Tree, context: SchematicContext) => {
    registerComponents(tree, registerContext, context);
    return tree;
  };

  return chain([discover, register]);
}
