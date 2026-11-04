import {
  ArrayLiteralExpression,
  createPrinter,
  EmitHint,
  ImportClause,
  ImportDeclaration,
  isArrayLiteralExpression,
  isImportDeclaration,
  isNamedImports,
  isStringLiteralLike,
  Node,
  NodeArray,
  ObjectLiteralExpression,
  SourceFile,
  SyntaxKind,
} from 'typescript';
import {
  Change,
  InsertChange,
  NoopChange,
} from '@schematics/angular/utility/change';
import { insertImport } from '@schematics/angular/utility/ast-utils';

/** How a file breaks lines and indents, for what gets inserted into it. */
export interface TextLayout {
  newLine: string;
  indentUnit: string;
}

export function textLayout(text: string): TextLayout {
  return {
    newLine: text.includes('\r\n') ? '\r\n' : '\n',
    indentUnit: /^([ \t]+)[^ \t*\r\n]/m.exec(text)?.[1] ?? '  ',
  };
}

/**
 * Imports a symbol for use as a value under its bare name. `insertImport` alone
 * takes a namespace import as providing it and adds it to an `import type`.
 */
export function insertNamedImport(
  sourceFile: SourceFile,
  filePath: string,
  symbol: string,
  packageName: string,
): Change {
  const declarations = sourceFile.statements
    .filter(isImportDeclaration)
    .filter(
      ({ moduleSpecifier }) =>
        isStringLiteralLike(moduleSpecifier) &&
        moduleSpecifier.text === packageName,
    );
  const specifiers = declarations.flatMap(valueSpecifiers);
  const lastDeclaration = declarations.at(-1);
  const lastSpecifier = specifiers.at(-1);

  return specifiers.some(
    ({ isTypeOnly, name }) => !isTypeOnly && name.text === symbol,
  )
    ? new NoopChange()
    : lastSpecifier
      ? new InsertChange(filePath, lastSpecifier.getEnd(), `, ${symbol}`)
      : lastDeclaration
        ? new InsertChange(
            filePath,
            lastDeclaration.getEnd(),
            `${textLayout(sourceFile.text).newLine}import { ${symbol} } from '${packageName}';`,
          )
        : insertImport(sourceFile, filePath, symbol, packageName);
}

function valueSpecifiers({ importClause }: ImportDeclaration) {
  const bindings = importClause?.namedBindings;

  return bindings && !isTypeOnly(importClause) && isNamedImports(bindings)
    ? [...bindings.elements]
    : [];
}

/**
 * Inserts instead of reprinting the literal, as printing reformats what is there
 * and drops comments. New members go after a comment on the last line, keeping
 * it with its member.
 */
export function appendToLiteral(
  sourceFile: SourceFile,
  filePath: string,
  literal: ArrayLiteralExpression | ObjectLiteralExpression,
  members: Node[],
): Change[] {
  const existing: NodeArray<Node> = isArrayLiteralExpression(literal)
    ? literal.elements
    : literal.properties;
  const text = sourceFile.text;
  const closing = literal.getEnd() - 1;
  const layout = textLayout(text);
  const { indentUnit } = layout;
  const lastLineFeed = text.lastIndexOf('\n', closing);
  const closingLineBreak =
    text[lastLineFeed - 1] === '\r' ? lastLineFeed - 1 : lastLineFeed;
  const newLine =
    lastLineFeed === -1
      ? layout.newLine
      : text.slice(closingLineBreak, lastLineFeed + 1);
  const indent = lineIndent(text, literal.getStart(sourceFile));
  const inner = text.slice(existing.end, closing);
  const last = existing.at(-1);
  const firstAfterMembers = /\S/.exec(inner)?.index;
  const anchor =
    last?.getStart(sourceFile) ??
    (firstAfterMembers === undefined
      ? undefined
      : existing.end + firstAfterMembers);
  const memberIndent =
    anchor !== undefined &&
    text.slice(literal.getStart(sourceFile), anchor).includes('\n')
      ? lineIndent(text, anchor)
      : `${indent}${indentUnit}`;
  const printer = createPrinter({});
  const lines = members
    .map((member) =>
      printer
        .printNode(EmitHint.Unspecified, member, sourceFile)
        .replace(
          /\n( *)/g,
          (_, spaces: string) =>
            `${newLine}${memberIndent}${indentUnit.repeat(spaces.length / 4)}`,
        ),
    )
    .map((printed) => `${newLine}${memberIndent}${printed}`)
    .join(',');
  const trailingComma = existing.hasTrailingComma ? ',' : '';

  return [
    ...(last && !existing.hasTrailingComma
      ? [new InsertChange(filePath, last.getEnd(), ',')]
      : []),
    inner.includes('\n')
      ? new InsertChange(filePath, closingLineBreak, `${lines}${trailingComma}`)
      : new InsertChange(filePath, closing, `${lines}${newLine}${indent}`),
  ];
}

function lineIndent(text: string, position: number) {
  const lineStart = text.lastIndexOf('\n', position - 1) + 1;

  return /^[ \t]*/.exec(text.slice(lineStart))?.[0] ?? '';
}

/** Read from the source, as the flag on the clause depends on the TypeScript version. */
function isTypeOnly(importClause: ImportClause) {
  return importClause.getFirstToken()?.kind === SyntaxKind.TypeKeyword;
}
