import {
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import {
  findSchematicsConfig,
  getProjectDefinition,
  NgxFormbarAutomationConfig,
  readFile,
} from '@ngx-formbar/setup';
import { Schema } from './schema';

export function schema(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const schemaContext = buildSchemaContext(
      options,
      await getWorkspace(tree),
      tree,
    );
    context.logger.info(
      `Generating schema from ${schemaContext.typeReference}`,
    );
  };
}

function buildSchemaContext(
  options: Schema,
  workspace: Awaited<ReturnType<typeof getWorkspace>>,
  tree: Tree,
) {
  const project = getProjectDefinition(workspace, options.project);
  const projectRoot = project.sourceRoot ?? project.root;

  const configPath = options.schematicsConfig
    ? `${projectRoot}/${options.schematicsConfig}`
    : findSchematicsConfig(tree);

  const automationConfig = readFile<NgxFormbarAutomationConfig | null>(
    tree,
    configPath,
  );

  const typeReference = options.type ?? automationConfig?.schema?.type;

  if (!typeReference) {
    throw new SchematicsException(
      'No content type configured. Set "schema.type" in formbar-schematic.config.json or pass --type.',
    );
  }

  return {
    typeReference,
    docs: automationConfig?.schema?.docs ?? true,
    entries: automationConfig?.schema?.emitters ?? [],
    projectRoot,
    // Tree paths are '/'-rooted and virtual; this is the real on-disk root,
    // needed to resolve emitter packages out of the consumer's node_modules.
    // `ng generate` runs with cwd at the workspace root.
    workspaceRoot: process.cwd(),
    tsConfigPath: `${project.root}/tsconfig.app.json`,
  };
}
