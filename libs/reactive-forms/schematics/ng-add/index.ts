import {
  chain,
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import { RuleContext, Schema } from './schema';

import { createHelperFiles } from './rules/create-helper-files.rule';
import { updateAppConfig } from './rules/update-app-config.rule';
import { updateSchematicsConfig } from './rules/update-schematics-config.rule';

import { installDependencies } from './rules/install-dependencies.rule';
import {
  DEFAULT_HELPER_PATH,
  DEFAULT_PROVIDER_CONFIG_FILE_NAME,
  DEFAULT_PROVIDER_CONFIG_PATH,
  SCHEMATICS_GENERATORS,
} from '../shared/constants';
import {
  DEFAULT_REGISTRATION_TYPE,
  DEFAULT_REGISTRATIONS_PATH,
  DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  DEFAULT_SCHEMATICS_CONFIG_PATH,
  getProjectDefinition,
  joinToSourceRoot,
  resolveProjectName,
  resolveRequiredPath,
} from '@ngx-formbar/setup';
import { createTokenRegistrationFiles } from './rules/create-token-registration-files.rule';
import { createConfigRegistrationFiles } from './rules/create-config-registration-files.rule';
import { createSchematicsConfig } from './rules/create-schematics-config.rule';
import { linkSchematicsConfig } from './rules/link-schematics-config.rule';
import { createFormbarRegistrationsConfig } from './rules/create-formbar-registration-config.rule';
import { createContentTypeFile } from './rules/create-content-type-file.rule';
import { locateRootConfig } from './root-config';
import { schematicsConfigLink } from './helper';

// noinspection JSUnusedGlobalSymbols
export function ngAdd(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(tree);
    const projectName = resolveProjectName(workspace, options.project);
    const project = getProjectDefinition(workspace, projectName);

    const sourceRoot = project.sourceRoot ?? project.root;

    context.logger.info(
      `📦 Setting up ngx-formbar in project "${projectName}"...`,
    );

    const registrationStyle =
      options.registrationStyle ?? DEFAULT_REGISTRATION_TYPE;

    const registrationsDirectory = locate(
      'registrationsPath',
      options.registrationsPath,
      DEFAULT_REGISTRATIONS_PATH,
      sourceRoot,
    );
    const providerConfigDirectory = locate(
      'providerConfigPath',
      options.providerConfigPath,
      DEFAULT_PROVIDER_CONFIG_PATH,
      sourceRoot,
    );
    const helperDirectory = locate(
      'helperPath',
      options.helperPath,
      DEFAULT_HELPER_PATH,
      sourceRoot,
    );
    const schematicsConfigDirectory = locate(
      'schematicsConfigPath',
      options.schematicsConfigPath,
      DEFAULT_SCHEMATICS_CONFIG_PATH,
      sourceRoot,
    );

    const rootConfig = locateRootConfig(
      tree,
      workspace,
      project,
      sourceRoot,
      context,
    );

    // A generator reads registrations inside provideFormbar only from a config
    // declared in a variable, so anywhere else they need a file of their own.
    const unreadableInline =
      rootConfig.holder !== 'variable' &&
      registrationStyle === 'config' &&
      !!options.provideInline &&
      !options.splitRegistrations;
    const splitRegistrations = unreadableInline || options.splitRegistrations;

    if (unreadableInline) {
      context.logger.info(
        `Keeping registrations in ${registrationsDirectory}, where the generators can add to them. They cannot read them from ${rootConfig.filePath}.`,
      );
    }

    const schematicConfigFileName = fileNameOrDefault(
      'schematicConfigFileName',
      options.schematicConfigFileName,
      DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
      '.json',
    );

    const ruleContext: RuleContext = {
      ...options,
      registrationStyle,
      providerConfigFileName: fileNameOrDefault(
        'providerConfigFileName',
        options.providerConfigFileName,
        DEFAULT_PROVIDER_CONFIG_FILE_NAME,
        '.ts',
      ),
      schematicConfigFileName,
      // The CLI always passes the file name, as its schema has a default.
      schematicsConfigNamed:
        !!options.schematicsConfigPath ||
        `${schematicConfigFileName}.json` !==
          DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
      schematicsConfigLink: schematicsConfigLink(
        project,
        SCHEMATICS_GENERATORS,
      ),
      splitRegistrations,
      appConfigPath: rootConfig.filePath,
      rootConfig,
      registrationsDirectory,
      providerConfigDirectory,
      helperDirectory,
      schematicsConfigDirectory,
      sourceRoot,
      projectName,
      useTokens: registrationStyle === 'token',
    };

    return chain([
      createTokenRegistrationFiles(ruleContext),
      createConfigRegistrationFiles(ruleContext),
      createFormbarRegistrationsConfig(ruleContext),
      createHelperFiles(ruleContext),
      createContentTypeFile(ruleContext),
      createSchematicsConfig(ruleContext),
      linkSchematicsConfig(ruleContext),
      updateSchematicsConfig(ruleContext),
      updateAppConfig(ruleContext),
      installDependencies(ruleContext),
    ]);
  };
}

/**
 * A default is always joined to the source root. Only a supplied value can
 * already lie inside it.
 */
function locate(
  option: string,
  value: string | undefined,
  fallback: string,
  sourceRoot: string,
) {
  return value
    ? resolveRequiredPath(option, value, sourceRoot)
    : joinToSourceRoot(fallback, sourceRoot);
}

/** An empty name, or one that is only the extension, falls back too. */
function fileNameOrDefault(
  option: string,
  value: string | undefined,
  fallback: string,
  extension: string,
) {
  const fileName = stripExtension(
    stripExtension(value ?? '', extension) || fallback,
    extension,
  );

  if (fileName.split('/').includes('..')) {
    throw new SchematicsException(
      `"${option}" must be a file name inside its directory: ${fileName}`,
    );
  }

  return fileName;
}

function stripExtension(fileName: string, extension: string) {
  return fileName.endsWith(extension)
    ? fileName.slice(0, -extension.length)
    : fileName;
}
