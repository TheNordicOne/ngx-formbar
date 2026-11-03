import { noop, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { addUnionMember, loadSourceFile } from '@ngx-formbar/setup';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import { applyToUpdateRecorder } from '@schematics/angular/utility/change';
import { parseTypeReference, resolveTypeFile } from '../type-reference';
import { ScaffoldContext, ScaffoldType } from '../schema';

/**
 * Adds the scaffolded interface to the content union named by `schema.type`, so
 * the next `schema` run sees it. Without a configured type there is no union to
 * maintain and the scaffold is left alone.
 *
 * A stale or malformed `schema.type` degrades to a warning rather than aborting
 * the scaffold, matching every other bookkeeping rule in this chain. The next
 * `schema` run reports an out-of-date union just as clearly as this rule would.
 */
export function registerUnion(ruleContext: ScaffoldContext): Rule {
  const reference = ruleContext.contentTypeReference;

  if (!reference) {
    return noop();
  }

  return (tree: Tree, context: SchematicContext) => {
    const parsed = parseReference(reference, ruleContext.sourceRoot, context);

    if (!parsed) {
      return tree;
    }

    const { unionPath, exportName } = parsed;
    const added = addMember(tree, unionPath, exportName, ruleContext, context);

    if (!added) {
      return tree;
    }

    const sourceFile = loadSourceFile(tree, unionPath);

    if (!sourceFile) {
      context.logger.warn(
        `${unionPath} could not be re-read after the union update. Skipping import registration.`,
      );
      return tree;
    }

    const importPath = buildRelativePath(
      unionPath,
      `${ruleContext.componentPath}/${ruleContext.interfaceFileName}`,
    );
    const recorder = tree.beginUpdate(unionPath);

    applyToUpdateRecorder(recorder, [
      insertImport(
        sourceFile,
        unionPath,
        ruleContext.interfaceName,
        importPath,
      ),
    ]);
    tree.commitUpdate(recorder);

    return tree;
  };
}

function parseReference(
  reference: string,
  sourceRoot: string,
  context: SchematicContext,
) {
  try {
    const { filePath, exportName } = parseTypeReference(reference);

    return {
      unionPath: resolveTypeFile(filePath, sourceRoot),
      exportName,
    };
  } catch (error) {
    context.logger.warn(`Skipping union update: ${messageOf(error)}`);
    return null;
  }
}

function addMember(
  tree: Tree,
  unionPath: string,
  exportName: string,
  ruleContext: ScaffoldContext,
  context: SchematicContext,
) {
  try {
    addUnionMember(
      tree,
      unionPath,
      exportName,
      ruleContext.interfaceName,
      typeArgumentFor(ruleContext.registrationKind, exportName),
    );
    return true;
  } catch (error) {
    context.logger.warn(`Skipping union update: ${messageOf(error)}`);
    return false;
  }
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

/** Groups and arrays are generic over the content they accept, which is the union itself. */
function typeArgumentFor(kind: ScaffoldType, unionName: string) {
  return kind === 'group' || kind === 'array' ? unionName : null;
}
