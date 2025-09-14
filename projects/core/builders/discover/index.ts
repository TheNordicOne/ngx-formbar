import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import { getSystemPath, normalize } from '@angular-devkit/core';
import * as path from 'path';
import { findComponents } from './component-discovery';
import { writeComponentsToFile } from './component-writer';
import { FormworkComponentInfo } from './models/component-info.model';

interface DiscoverOptions {
  include?: string[];
  exclude?: string[];
  outputPath?: string;
}

export default createBuilder<DiscoverOptions>(
  (options, context: BuilderContext): Promise<BuilderOutput> => {
    context.logger.info('Starting component discovery...');

    try {
      // Get workspace root path
      const workspaceRoot = getSystemPath(normalize(context.workspaceRoot));
      context.logger.info(`Workspace root: ${workspaceRoot}`);

      // Set default values for options
      const include = options.include ?? ['**/*.ts'];
      const exclude = options.exclude ?? ['**/node_modules/**', '**/*.spec.ts'];
      const outputPath = options.outputPath ?? 'formwork-components.json';

      // Resolve output path relative to workspace root
      const resolvedOutputPath = path.resolve(workspaceRoot, outputPath);

      context.logger.info(
        `Discovering components with patterns: ${include.join(', ')}`,
      );
      context.logger.info(`Excluding: ${exclude.join(', ')}`);

      // Find components matching the patterns
      const components: FormworkComponentInfo[] = findComponents(
        workspaceRoot,
        include,
        exclude,
      );

      context.logger.info(
        `Discovered ${String(components.length)} Ngx Formwork components`,
      );

      // Write the discovered components to the output file
      writeComponentsToFile(components, resolvedOutputPath, workspaceRoot);

      context.logger.info(
        `Component information saved to: ${resolvedOutputPath}`,
      );

      return Promise.resolve({ success: true });
    } catch (error) {
      context.logger.fatal('Component discovery failed!');
      context.logger.error(
        error instanceof Error ? error.message : String(error),
      );
      return Promise.resolve({ success: false });
    }
  },
);
