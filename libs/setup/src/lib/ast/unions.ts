import { SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  isTypeAliasDeclaration,
  isUnionTypeNode,
  SourceFile,
  TypeAliasDeclaration,
} from 'typescript';
import { loadSourceFile } from './parse';

/**
 * Adds `memberName` to the union type alias `unionName` in `filePath`,
 * replacing a `never` placeholder and skipping members that are already present.
 */
export function addUnionMember(
  tree: Tree,
  filePath: string,
  unionName: string,
  memberName: string,
  typeArgument: string | null,
): void {
  const sourceFile = loadSourceFile(tree, filePath);

  if (!sourceFile) {
    throw new SchematicsException(`Union file not found: ${filePath}`);
  }

  const alias = sourceFile.statements
    .filter(isTypeAliasDeclaration)
    .find((statement) => statement.name.text === unionName);

  if (!alias) {
    throw new SchematicsException(
      `${filePath} has no type alias named "${unionName}".`,
    );
  }

  const member = typeArgument ? `${memberName}<${typeArgument}>` : memberName;

  if (readMembers(alias, sourceFile).includes(member)) {
    return;
  }

  const content = sourceFile.getFullText();
  const existing = alias.type.getText(sourceFile);
  const replacement =
    existing.trim() === 'never' ? member : `${existing}\n  | ${member}`;
  const start = alias.type.getStart(sourceFile);
  const end = alias.type.getEnd();

  tree.overwrite(
    filePath,
    `${content.slice(0, start)}${replacement}${content.slice(end)}`,
  );
}

/**
 * Membership is read from the alias's own members rather than the file text, so
 * an existing import of the same symbol cannot mask a missing union member.
 */
function readMembers(alias: TypeAliasDeclaration, sourceFile: SourceFile) {
  const types = isUnionTypeNode(alias.type) ? alias.type.types : [alias.type];

  return types.map((type) => type.getText(sourceFile).trim());
}
