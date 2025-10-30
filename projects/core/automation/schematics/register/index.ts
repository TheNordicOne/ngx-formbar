import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';

import { discoverComponents } from './discover-components';
import { DiscoverOptions, RegisterContext } from './schema';
import { registerComponents } from './register-components';
import { ProjectDefinition } from '@schematics/angular/utility/workspace';
import { findConfigPath, findSchematicsConfig, readFile } from '../shared/file';
import { DEFAULT_REGISTRATION_TYPE } from '../../shared/constants';
import { getProject } from '../shared/helper';
import { NgxFormbarAutomationConfig } from '../../shared/shared-config.type';

export function register(options: DiscoverOptions): Rule {
  let registerContext: RegisterContext;

  const mergeConfigs: Rule = async (tree: Tree) => {
    const project = await getProject(tree, options.project);
    registerContext = mergeOptions(options, project, tree);
    return tree;
  };

  const discover: Rule = (tree: Tree, context: SchematicContext) => {
    registerContext = discoverComponents(tree, registerContext, context);
    return tree;
  };

  const register: Rule = (tree: Tree, context: SchematicContext) => {
    return registerComponents(tree, registerContext, context);
  };

  return chain([mergeConfigs, discover, register]);
}

function mergeOptions(
  options: DiscoverOptions,
  project: ProjectDefinition,
  tree: Tree,
) {
  const projectRoot = project.sourceRoot ?? project.root;

  const automationConfigPath = options.schematicsConfig
    ? `/${projectRoot}/${options.schematicsConfig}`
    : findSchematicsConfig(tree);

  const automationConfig = readFile<NgxFormbarAutomationConfig | null>(
    tree,
    automationConfigPath,
  );

  const discoverConfig = automationConfig ? automationConfig.discovery : {};

  const controlRegistrations = automationConfig?.controlRegistrationsPath
    ? `/${projectRoot}/${automationConfig.controlRegistrationsPath}`
    : findConfigPath(tree, projectRoot);

  const mergedConfig: RegisterContext = {
    ...options,
    ...discoverConfig,
    controlRegistrations,
    registrationType:
      automationConfig?.registrationType ?? DEFAULT_REGISTRATION_TYPE,
    components: [],
  };

  return mergedConfig;
}
