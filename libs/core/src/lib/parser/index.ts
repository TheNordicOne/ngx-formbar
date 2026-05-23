/**
 * Public API of the vendored expression parser.
 *
 * Adapted from JSEP (https://github.com/EricSmekens/jsep) under MIT license.
 * See `LICENSE-jsep` in this directory for the original notice.
 *
 * Plugins are registered once at module load so consumers do not have to
 * think about wiring.
 */

import { Parser } from './core';
import { arrowPlugin } from './plugins/arrow';
import { objectPlugin } from './plugins/object';
import { regexPlugin } from './plugins/regex';
import { spreadPlugin } from './plugins/spread';
import { templatePlugin } from './plugins/template';
import { ternaryPlugin } from './plugins/ternary';

import type { Program } from './ast';

// Plugin registration order matters: the ternary plugin's after-expression
// hook needs to run before the arrow plugin's transform so it can do the
// `=>` precedence rewrite while `=>` is still a BinaryExpression node.
Parser.register(
  ternaryPlugin,
  arrowPlugin,
  objectPlugin,
  regexPlugin,
  spreadPlugin,
  templatePlugin,
);

/**
 * Parses an expression source string into a {@link Program} wrapper.
 *
 * The wrapper's `body` is a single {@link Expression} node. Multi-statement
 * inputs (`a; b`), comma-sequence inputs (`(a, b)`), `this`, assignment, and
 * other unsupported constructs throw at parse time so they cannot reach the
 * evaluator.
 */
export function parse(source: string): Program {
  const body = Parser.parse(source);
  return { type: 'Program', body };
}

export type {
  ArrayExpression,
  ArrowFunctionExpression,
  BinaryExpression,
  BinaryOperator,
  CallExpression,
  ConditionalExpression,
  Expression,
  Identifier,
  Literal,
  LogicalExpression,
  LogicalOperator,
  MemberExpression,
  ObjectExpression,
  Program,
  Property,
  SpreadElement,
  TemplateElement,
  TemplateLiteral,
  UnaryExpression,
  UnaryOperator,
} from './ast';
