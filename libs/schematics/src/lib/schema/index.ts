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
import { EmitPaths } from './emitter/define-emitter';
import { builtInDefaultOutput, resolveEmitter } from './emitter/registry';
import { findTsConfigPath } from './program';
import { resolveRequiredProjectPath } from './project-path';
import { findWorkspaceRoot } from './workspace-root';
import { FormModel } from './model';
import { CORE_PACKAGE_NAME } from '../shared/constants';

export function schema(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const schemaContext = buildSchemaContext(
      options,
      await getWorkspace(tree),
      tree,
    );
    const entries = selectEntries(schemaContext.entries, options.emitter ?? []);

    if (entries.length === 0) {
      context.logger.info(
        'No emitters configured in "schema.emitters". Nothing was written.',
      );
      return;
    }

    if (options.output && entries.length > 1) {
      throw new SchematicsException(
        '"--output" overrides a single configured emitter entry. Narrow the run with "--emitter" first.',
      );
    }

    assertObjectOptions(entries);

    const runs = entries.map((entry) => {
      const output = options.output ?? entry.output;

      return {
        entry,
        paths: {
          workspaceRoot: schemaContext.workspaceRoot,
          projectRoot: schemaContext.projectRoot,
          output: output
            ? resolveRequiredProjectPath(
                'output',
                output,
                schemaContext.projectRoot,
              )
            : builtInDefaultOutput(entry.use, schemaContext.projectRoot),
        },
      };
    });

    assertDistinctOutputs(runs);

    const { type, checker, coreRoot } = resolveContentType(tree, schemaContext);

    // Which copy of core answered decides every node's kind, and a wrong answer
    // shows up as an unrelated "does not extend a base type" further down.
    context.logger.info(`Resolved ${CORE_PACKAGE_NAME} at "${coreRoot}"`);

    const model = buildModel(type, checker, coreRoot);

    warnUnsatisfiableNodes(model, context);

    for (const { entry, paths } of runs) {
      const emitter = resolveEmitter(entry.use, tree, paths);

      await emitter.emit(model, {
        tree,
        options: entry.options ?? {},
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
 * An omitted `--emitter` arrives here as `[]`, not `undefined`. The schematics
 * workflow's option-schema validation defaults an array-typed option that way.
 * `[]` is truthy, so a plain `options.emitter ? ... : entries` check would treat
 * every unfiltered run as "run nothing". Checking `length` instead treats both
 * "not passed" and "passed empty" as "no filter".
 */
function selectEntries(entries: SchemaEmitterEntry[], requested: string[]) {
  const configured = entries.map((entry) => entry.use);
  const unmatched = requested.filter((value) => !configured.includes(value));

  if (unmatched.length > 0) {
    throw new SchematicsException(
      `--emitter ${quoteAll(unmatched)} matches no configured emitter entry. Configured: ${quoteAll(configured) || 'none'}.`,
    );
  }

  return requested.length > 0
    ? entries.filter((entry) => requested.includes(entry.use))
    : entries;
}

function assertObjectOptions(entries: SchemaEmitterEntry[]) {
  for (const { use, options } of entries) {
    if (options !== undefined && !isObject(options)) {
      throw new SchematicsException(
        `"options" of the "${use}" emitter entry must be an object, got ${JSON.stringify(options)}.`,
      );
    }
  }
}

function isObject(value: unknown) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertDistinctOutputs(
  runs: { entry: SchemaEmitterEntry; paths: EmitPaths }[],
) {
  const writers = new Map<string, string[]>();

  for (const { entry, paths } of runs) {
    // A custom emitter without an output picks its own files.
    if (paths.output) {
      writers.set(paths.output, [
        ...(writers.get(paths.output) ?? []),
        entry.use,
      ]);
    }
  }

  for (const [target, uses] of writers) {
    if (uses.length > 1) {
      throw new SchematicsException(
        `Emitter entries ${quoteAll(uses)} write to the same output (${target}). Set a distinct "output" on each.`,
      );
    }
  }
}

function quoteAll(values: string[]) {
  return values.map((value) => `"${value}"`).join(', ');
}

/**
 * A required property with no JSON form makes its node unsatisfiable: the
 * property emits the `false` schema and stays in `required`, so nothing can
 * ever match. That is faithful, because a control requiring a function-valued
 * property genuinely cannot be written in JSON. A validator, however, will only
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
    entries: automationConfig?.schema?.emitters ?? [],
    projectRoot,
    // Tree paths are '/'-rooted and virtual; this is the real on-disk root,
    // needed to resolve emitter packages out of the consumer's node_modules.
    workspaceRoot: findWorkspaceRoot(process.cwd()),
    tsConfigPath: findTsConfigPath(tree, project),
  };
}
