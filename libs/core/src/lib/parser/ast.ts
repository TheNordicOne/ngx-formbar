/**
 * AST node types produced by the vendored expression parser.
 *
 * The grammar is intentionally a small subset of JavaScript expressions.
 * Statements, declarations, control flow, classes, and assignments are not
 * representable. See {@link Program} for the root wrapper.
 *
 * Adapted from JSEP (https://github.com/EricSmekens/jsep) under MIT license.
 */

export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface Literal {
  type: 'Literal';
  value: string | number | boolean | RegExp | null;
  raw: string;
}

export interface MemberExpression {
  type: 'MemberExpression';
  computed: boolean;
  object: Expression;
  property: Expression;
  optional?: boolean;
}

export interface CallExpression {
  type: 'CallExpression';
  callee: Expression;
  arguments: (Expression | SpreadElement)[];
  optional?: boolean;
}

export type UnaryOperator = '-' | '+' | '!' | '~' | 'typeof' | 'void';

export interface UnaryExpression {
  type: 'UnaryExpression';
  operator: UnaryOperator;
  argument: Expression;
  prefix: true;
}

export type BinaryOperator =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '**'
  | '<'
  | '>'
  | '<='
  | '>='
  | '=='
  | '!='
  | '==='
  | '!=='
  | '|'
  | '&'
  | '^'
  | '<<'
  | '>>'
  | '>>>'
  | 'in';

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
}

export type LogicalOperator = '&&' | '||' | '??';

export interface LogicalExpression {
  type: 'LogicalExpression';
  operator: LogicalOperator;
  left: Expression;
  right: Expression;
}

export interface ConditionalExpression {
  type: 'ConditionalExpression';
  test: Expression;
  consequent: Expression;
  alternate: Expression;
}

export interface ArrayExpression {
  type: 'ArrayExpression';
  elements: (Expression | SpreadElement | null)[];
}

export interface ArrowFunctionExpression {
  type: 'ArrowFunctionExpression';
  params: Identifier[];
  body: Expression;
}

export interface SpreadElement {
  type: 'SpreadElement';
  argument: Expression;
}

export interface ObjectExpression {
  type: 'ObjectExpression';
  properties: (Property | SpreadElement)[];
}

export interface Property {
  type: 'Property';
  computed: boolean;
  key: Identifier | Literal | Expression;
  value: Expression;
  shorthand: boolean;
}

export interface TemplateElement {
  type: 'TemplateElement';
  value: { cooked: string; raw: string };
  tail: boolean;
}

export interface TemplateLiteral {
  type: 'TemplateLiteral';
  quasis: TemplateElement[];
  expressions: Expression[];
}

/**
 * Discriminated union of every AST node the parser produces and the
 * evaluator accepts.
 */
export type Expression =
  | Identifier
  | Literal
  | MemberExpression
  | CallExpression
  | UnaryExpression
  | BinaryExpression
  | LogicalExpression
  | ConditionalExpression
  | ArrayExpression
  | ArrowFunctionExpression
  | ObjectExpression
  | TemplateLiteral;

/**
 * Parser-internal transient produced by `(a, b)` style groups. Not part of
 * the public {@link Expression} surface; the parser expands this in
 * downstream hooks (the arrow plugin uses it to encode multi-parameter
 * arrow heads) and rejects it at the top level.
 */
export interface SequenceExpression {
  type: 'SequenceExpression';
  expressions: Expression[];
}

/**
 * Root wrapper returned by {@link parse}. The wrapper is intentionally a
 * fixed shape with a single expression body so consumers never need to
 * branch on the AST root.
 */
export interface Program {
  type: 'Program';
  body: Expression;
}
