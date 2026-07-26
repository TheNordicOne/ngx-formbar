import { noop, Rule, Tree } from '@angular-devkit/schematics';
import { addUnionMember, loadSourceFile } from '@ngx-formbar/setup';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { insertImport } from '@schematics/angular/utility/ast-utils';
import { applyToUpdateRecorder } from '@schematics/angular/utility/change';
import { parseTypeReference } from '../../schema/resolve';
import { ScaffoldContext, ScaffoldType } from '../schema';

/**
 * Adds the scaffolded interface to the content union named by `schema.type`, so
 * the next `schema` run sees it. Without a configured type there is no union to
 * maintain and the scaffold is left alone.
 */
export function registerUnion(context: ScaffoldContext): Rule {
  const reference = context.contentTypeReference;

  if (!reference) {
    return noop();
  }

  return (tree: Tree) => {
    const { filePath, exportName } = parseTypeReference(reference);
    const unionPath = `/${context.projectRoot}/${filePath}`;

    addUnionMember(
      tree,
      unionPath,
      exportName,
      context.interfaceName,
      typeArgumentFor(context.registrationKind, exportName),
    );

    const sourceFile = loadSourceFile(tree, unionPath);

    if (!sourceFile) {
      return tree;
    }

    const importPath = buildRelativePath(
      unionPath,
      `/${context.componentPath}/${context.interfaceFileName}`,
    );
    const recorder = tree.beginUpdate(unionPath);

    applyToUpdateRecorder(recorder, [
      insertImport(sourceFile, unionPath, context.interfaceName, importPath),
    ]);
    tree.commitUpdate(recorder);

    return tree;
  };
}

/** Groups and arrays are generic over the content they accept — the union itself. */
function typeArgumentFor(kind: ScaffoldType, unionName: string) {
  return kind === 'group' || kind === 'array' ? unionName : null;
}
