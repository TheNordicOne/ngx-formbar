import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { DiscoverOptions, RegisterContext } from './schema';

export function discoverComponents(
  tree: Tree,
  options: DiscoverOptions,
  context: SchematicContext,
) {
  const registerContext: RegisterContext = {
    ...options,
    components: [],
  };
  context.logger.info(
    `${registerContext.components.length.toString()} components discovered`,
  );

  return registerContext;
}
