import {
  Rule,
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { getWorkspace } from '@schematics/angular/utility/workspace';
import {
  getProjectDefinition,
  loadAutomationConfig,
  SchemaEmitterEntry,
} from '@ngx-formbar/setup';
import { Schema } from './schema';
import { resolveContentType } from './resolve';
import { buildModel } from './build-model';
import { toJsonTypes } from './json-types';
import { resolveEmitter } from './emitter/registry';
import { FormModel } from './model';
import { CORE_PACKAGE_NAME } from '../shared/constants';

export function schema(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const schemaContext = buildSchemaContext(
      options,
      await getWorkspace(tree),
      tree,
    );
    const entries = selectEntries(schemaContext.entries, options);

    if (entries.length === 0) {
      throw new SchematicsException(
        'No emitters configured. Add entries to "schema.emitters" in formbar-schematic.config.json.',
      );
    }

    if (options.output && entries.length > 1) {
      throw new SchematicsException(
        '"--output" overrides a single configured emitter entry. Narrow the run with "--emitter" first.',
      );
    }

    const { type, checker, coreRoot } = resolveContentType(tree, schemaContext);

    // Which copy of core answered decides every node's kind, and a wrong answer
    // shows up as an unrelated "does not extend a base type" further down.
    context.logger.info(`Resolved ${CORE_PACKAGE_NAME} at "${coreRoot}"`);

    const model = buildModel(type, checker, coreRoot, schemaContext.docs);

    warnUnsatisfiableNodes(model, context);

    for (const entry of entries) {
      const paths = {
        workspaceRoot: schemaContext.workspaceRoot,
        projectRoot: schemaContext.projectRoot,
        output: resolveOutput(
          options.output ?? entry.output,
          schemaContext.projectRoot,
        ),
      };
      const emitter = resolveEmitter(entry.use, tree, paths);

      await emitter.emit(model, {
        tree,
        options: { docs: schemaContext.docs, ...entry.options },
        logger: context.logger,
        paths,
      });

      context.logger.info(
        `Emitted with "${emitter.name}" to "${paths.output ?? '(emitter default)'}"`,
      );
    }
  };
}

/**
 * An omitted `--emitter` arrives here as `[]`, not `undefined` — the schematics
 * workflow's option-schema validation defaults an array-typed option that way.
 * `[]` is truthy, so a plain `options.emitter ? ... : entries` check would treat
 * every unfiltered run as "run nothing". Checking `length` instead treats both
 * "not passed" and "passed empty" as "no filter".
 */
function selectEntries(entries: SchemaEmitterEntry[], options: Schema) {
  return options.emitter?.length
    ? entries.filter((entry) => options.emitter?.includes(entry.use))
    : entries;
}

/**
 * A required property with no JSON form makes its node unsatisfiable: the
 * property emits the `false` schema and stays in `required`, so nothing can
 * ever match. That is faithful — a control requiring a function-valued
 * property genuinely cannot be written in JSON — but a validator will only
 * say "must match a schema in anyOf", with no clue why. Name it at generation
 * time instead. Every function-capable property in core's base types is
 * optional, so this is only reachable from a consumer's own declaration.
 */
function warnUnsatisfiableNodes(model: FormModel, context: SchematicContext) {
  for (const node of Object.values(model.nodes)) {
    for (const property of node.properties) {
      const unsatisfiable =
        !property.optional && toJsonTypes(property.type) === null;

      if (unsatisfiable) {
        context.logger.warn(
          `"${node.name}.${property.name}" is required but has no JSON representation, so no config can satisfy "${node.name}".`,
        );
      }
    }
  }
}

/**
 * Output paths are project-relative, matching how `use` and the `type`
 * reference already resolve. A leading `/` means workspace-absolute, for the
 * consumer who genuinely wants to write outside their project. Resolving here
 * rather than in each emitter keeps every emitter — ours and a consumer's —
 * from having to know the convention.
 */
function resolveOutput(output: string | undefined, projectRoot: string) {
  if (!output) {
    return null;
  }

  return output.startsWith('/') ? output : `/${projectRoot}/${output}`;
}

function buildSchemaContext(
  options: Schema,
  workspace: Awaited<ReturnType<typeof getWorkspace>>,
  tree: Tree,
) {
  const project = getProjectDefinition(workspace, options.project);
  const projectRoot = project.sourceRoot ?? project.root;

  const automationConfig = loadAutomationConfig(
    tree,
    projectRoot,
    options.schematicsConfig,
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
