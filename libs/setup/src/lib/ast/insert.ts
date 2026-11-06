import {
  ArrayLiteralExpression,
  createPrinter,
  EmitHint,
  ImportClause,
  ImportDeclaration,
  isArrayLiteralExpression,
  isExpressionStatement,
  isImportDeclaration,
  isNamedImports,
  isStringLiteral,
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

/** Whether a symbol can be used as a value under its bare name. */
export function isNamedImported(
  sourceFile: SourceFile,
  symbol: string,
  packageName: string,
): boolean {
  return importsFrom(sourceFile, packageName)
    .flatMap(valueSpecifiers)
    .some(
      (specifier) => !specifier.isTypeOnly && specifier.name.text === symbol,
    );
}

/**
 * Imports a symbol for use as a value under its bare name.
 *
 * Does not use `ast-utils` of `@schematics/angular`: it tests nodes with the
 * TypeScript bundled there, whose syntax kinds can differ from the TypeScript of
 * the app that parsed them.
 */
export function insertNamedImport(
  sourceFile: SourceFile,
  filePath: string,
  symbol: string,
  packageName: string,
): Change {
  const declarations = importsFrom(sourceFile, packageName);
  const lastSpecifier = declarations.flatMap(valueSpecifiers).at(-1);
  const first = sourceFile.statements.at(0);
  const anchor =
    declarations.at(-1) ??
    sourceFile.statements.filter(isImportDeclaration).at(-1) ??
    (first && isExpressionStatement(first) && isStringLiteral(first.expression)
      ? first
      : undefined);
  const { newLine } = textLayout(sourceFile.text);
  const statement = `import { ${symbol} } from '${packageName}';`;

  return isNamedImported(sourceFile, symbol, packageName)
    ? new NoopChange()
    : lastSpecifier
      ? new InsertChange(filePath, lastSpecifier.getEnd(), `, ${symbol}`)
      : anchor
        ? new InsertChange(filePath, anchor.getEnd(), `${newLine}${statement}`)
        : new InsertChange(filePath, 0, `${statement}${newLine}`);
}

function importsFrom({ statements }: SourceFile, packageName: string) {
  return statements
    .filter(isImportDeclaration)
    .filter(
      ({ moduleSpecifier }) =>
        isStringLiteralLike(moduleSpecifier) &&
        moduleSpecifier.text === packageName,
    );
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
  const closingOnOwnLine =
    inner.includes('\n') && !text.slice(lastLineFeed, closing).trim();

  return [
    ...(last && !existing.hasTrailingComma
      ? [new InsertChange(filePath, last.getEnd(), ',')]
      : []),
    closingOnOwnLine
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
