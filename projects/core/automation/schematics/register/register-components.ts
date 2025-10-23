import { SchematicContext, Tree } from '@angular-devkit/schematics';
import { RegisterContext } from './schema';

export function registerComponents(
  tree: Tree,
  registerContext: RegisterContext | undefined,
  context: SchematicContext,
) {
  if (!registerContext) {
    context.logger.error(
      'Component registration failed, because no proper context was generated!',
    );
    return;
  }
  context.logger.info(`Components registered`);
}
