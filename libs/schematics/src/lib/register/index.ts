import {
  chain,
  Rule,
  SchematicContext,
  Tree,
} from '@angular-devkit/schematics';

import { discoverComponents } from './discover-components';
import { DiscoverOptions, RegisterContext } from './schema';
import { registerComponents } from './register-components';
import {
  getWorkspace,
  ProjectDefinition,
  WorkspaceDefinition,
} from '@schematics/angular/utility/workspace';
import {
  loadAutomationConfig,
  DEFAULT_REGISTRATION_TYPE,
  getProjectDefinition,
  otherProjectDirectories,
  resolveRegistrationsPath,
} from '@ngx-formbar/setup';

export function register(options: DiscoverOptions): Rule {
  let registerContext: RegisterContext;

  const mergeConfigs: Rule = async (tree: Tree, context: SchematicContext) => {
    const workspace = await getWorkspace(tree);
    const project = getProjectDefinition(workspace, options.project);
    registerContext = mergeOptions(options, project, workspace, tree, context);
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
  workspace: WorkspaceDefinition,
  tree: Tree,
  context: SchematicContext,
) {
  const projectRoot = project.sourceRoot ?? project.root;

  const automationConfig = loadAutomationConfig(
    tree,
    projectRoot,
    context.logger,
    options.schematicsConfig,
  );

  const discoverConfig = automationConfig ? automationConfig.discovery : {};

  const configuredRegistrations =
    automationConfig?.controlRegistrationsPath ??
    options.controlRegistrationsPath ??
    options.controlRegistrations;

  const controlRegistrations = resolveRegistrationsPath(
    tree,
    projectRoot,
    configuredRegistrations,
  );

  const mergedConfig: RegisterContext = {
    ...options,
    ...discoverConfig,
    controlRegistrations,
    configuredRegistrations,
    registrationType:
      automationConfig?.registrationType ??
      options.registrationType ??
      DEFAULT_REGISTRATION_TYPE,
    components: [],
    sourceRoot: projectRoot,
    otherProjectDirectories: otherProjectDirectories(project, workspace),
  };

  return mergedConfig;
}
