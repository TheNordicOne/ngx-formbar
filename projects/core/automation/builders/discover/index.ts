import {
  Builder,
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import { getSystemPath, JsonObject, normalize } from '@angular-devkit/core';
import * as path from 'path';
import * as fs from 'fs';
import { findComponents } from './component-discovery';
import { writeComponentsToFile } from './component-writer';
import { NgxFormworkAutomationConfig } from '../../shared/shared-config.type';

interface DiscoverOptions {
  include: string[];
  exclude: string[];
  outputPath?: string;
  configPath?: string;
}

const alwaysExclude = ['**/node_modules/**', '**/*.spec.ts'];

/**
 * Reads the automation configuration from a file if it exists
 * @param configPath Path to the configuration file
 * @returns The automation configuration or null if not found
 */
function readAutomationConfig(
  configPath: string,
): NgxFormworkAutomationConfig | null {
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content) as NgxFormworkAutomationConfig;
    }
  } catch (error) {
    console.warn(`Failed to read automation config from ${configPath}:`, error);
  }
  return null;
}

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
          automationConfig = readAutomationConfig(configPath);
        }

        context.logger.info(
          `Discovering components with patterns: ${include.join(', ')}`,
        );
        context.logger.info(`Excluding: ${exclude.join(', ')}`);

        const components = findComponents(workspaceRoot, include, exclude);

        context.logger.info(
          `Discovered ${String(components.length)} Ngx Formwork components`,
        );

        writeComponentsToFile(components, resolvedOutputPath, automationConfig);

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

export default discoverBuilder;
