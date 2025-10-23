import {
  Builder,
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import { getSystemPath, JsonObject, normalize } from '@angular-devkit/core';
import * as path from 'path';
import { findComponents } from './component-discovery';
import { writeComponentsToFile } from './component-writer';
import { NgxFormworkAutomationConfig } from '../../shared/shared-config.type';
import { readAutomationConfig } from './helper';

const alwaysExclude = ['**/node_modules/**', '**/*.spec.ts'];

const discoverBuilder: Builder<DiscoverOptions & JsonObject> =
  createBuilder<DiscoverOptions>(
    (options, context: BuilderContext): Promise<BuilderOutput> => {
      context.logger.info('Starting component discovery...');

      try {
        const workspaceRoot = getSystemPath(normalize(context.workspaceRoot));
        context.logger.info(`Workspace root: ${workspaceRoot}`);

        const include = options.include;
        const exclude = [...alwaysExclude, ...options.exclude];
        const outputPath = options.outputPath ?? 'control-registrations.ts';
        const resolvedOutputPath = path.resolve(workspaceRoot, outputPath);

        // Read automation configuration if provided
        let automationConfig: NgxFormworkAutomationConfig | null = null;
        if (options.configPath) {
          const configPath = path.resolve(workspaceRoot, options.configPath);
          context.logger.info(`Reading automation config from: ${configPath}`);
          automationConfig = readAutomationConfig(configPath, context);
        }

        context.logger.info(
          `Discovering components with patterns: ${include.join(', ')}`,
        );
        context.logger.info(`Excluding: ${exclude.join(', ')}`);

        const components = findComponents(workspaceRoot, include, exclude);

        context.logger.info(
          `Discovered ${String(components.length)} Ngx Formwork components`,
        );

        const success = writeComponentsToFile(
          components,
          resolvedOutputPath,
          automationConfig ?? {},
          context,
        );

        if (success) {
          context.logger.info(
            `Component information saved to: ${resolvedOutputPath}`,
          );
        }

        return Promise.resolve({ success });
      } catch (error) {
        context.logger.fatal('Component discovery failed!');
        context.logger.error(
          error instanceof Error ? error.message : String(error),
        );
        return Promise.resolve({ success: false });
      }
    },
  );

export default discoverBuilder;
