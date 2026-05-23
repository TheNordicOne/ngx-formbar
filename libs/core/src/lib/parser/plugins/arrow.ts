/**
 * Arrow function plugin.
 *
 * Adapted from @jsep-plugin/arrow under MIT license.
 *
 * Adds support for `() => x`, `v => v`, `(a, b) => v`. The body must be an
 * expression; block bodies (`x => { ... }`) are not supported because the
 * core parser does not parse statements.
 */

import type { Plugin } from '../plugins';
import type {
  ArrowFunctionExpression,
  Expression,
  Identifier,
  SequenceExpression,
  SpreadElement,
} from '../ast';

interface BinaryNode {
  type: 'BinaryExpression' | 'LogicalExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

interface SequenceLike {
  type: string;
  expressions: Identifier[];
}

export const arrowPlugin: Plugin = {
  name: 'arrow',

  init(jsep) {
    // Right-associative low-precedence so `=>` binds last.
    jsep.addBinaryOp('=>', 0.1, true);

    // Empty-parameter arrows (`() => x`) need a special case: `()` would
    // otherwise parse as an empty group and short-circuit before `=>`.
    jsep.hooks.add('gobble-expression', function gobbleEmptyArrowArg(env) {
      this.gobbleSpaces();
      if (this.code() === jsep.OPAREN_CODE) {
        const backupIndex = this.index;
        this.index++;
        this.gobbleSpaces();
        if (this.code() === jsep.CPAREN_CODE) {
          this.index++;
          const biop = this.gobbleBinaryOp();
          if (biop === '=>') {
            const body = this.gobbleBinaryExpression();
            if (!body) {
              this.throwError('Expected expression after ' + biop);
            }
            env.node = {
              type: 'ArrowFunctionExpression',
              params: [],
              body,
            } as ArrowFunctionExpression;
            return;
          }
        }
        this.index = backupIndex;
      }
    });

    // `=>` is parsed as a binary operator (see addBinaryOp above), so the
    // resulting BinaryExpression nodes have to be rewritten into
    // ArrowFunctionExpression nodes after the fact.
    jsep.hooks.add('after-expression', function fixBinaryArrow(env) {
      updateBinariesToArrows(env.node);
    });

    function updateBinariesToArrows(
      node:
        | Expression
        | SpreadElement
        | SequenceExpression
        | false
        | undefined,
    ) {
      if (!node) {
        return;
      }

      for (const key of Object.keys(node)) {
        const value = (node as unknown as Record<string, unknown>)[key];
        if (value && typeof value === 'object') {
          if (Array.isArray(value)) {
            for (const item of value) {
              updateBinariesToArrows(item as Expression);
            }
          } else {
            updateBinariesToArrows(value as Expression);
          }
        }
      }

      const binary = node as unknown as BinaryNode;
      if (binary.operator !== '=>') {
        return;
      }
      const arrow = node as unknown as ArrowFunctionExpression & {
        left?: Expression;
        right?: Expression;
        operator?: string;
      };
      const left = binary.left;
      const seq = left as unknown as SequenceLike;
      const params: Identifier[] =
        seq.type === 'SequenceExpression'
          ? seq.expressions
          : [left as Identifier];
      // Reject `(...x) => x` and any other non-Identifier param shape so
      // a SpreadElement never reaches the evaluator (which would emit a
      // generic "Unsupported node type" error).
      for (const param of params) {
        if ((param as { type: string }).type !== 'Identifier') {
          throw new Error(
            `Arrow function parameters must be plain identifiers, got ${
              (param as { type: string }).type
            }`,
          );
        }
      }
      // Reject SpreadElement / SequenceExpression as the body so the
      // evaluator never receives an arrow with a transient body shape.
      const body = binary.right as { type?: string } | undefined;
      if (
        body &&
        (body.type === 'SpreadElement' || body.type === 'SequenceExpression')
      ) {
        throw new Error(
          `Arrow function body must be an expression, got ${body.type}`,
        );
      }
      arrow.type = 'ArrowFunctionExpression';
      arrow.params = params;
      arrow.body = binary.right;
      delete arrow.left;
      delete arrow.right;
      delete arrow.operator;
    }
  },
};
