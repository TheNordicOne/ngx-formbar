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
  expressions?: Identifier[];
}

export const arrowPlugin: Plugin = {
  name: 'arrow',

  init(jsep) {
    // Right-associative low-precedence operator so `=>` binds last.
    jsep.addBinaryOp('=>', 0.1, true);

    // Special-case `()` followed by `=>` so empty-parameter arrows parse.
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

    // Walk the parsed tree and convert any `=>` BinaryExpression into an
    // ArrowFunctionExpression. This is needed because `=>` was registered
    // as a binary operator and shows up that way in the AST.
    jsep.hooks.add('after-expression', function fixBinaryArrow(env) {
      updateBinariesToArrows(env.node, () => {
        // No-op: throwError is on `this`, but we only throw on bad shapes
        // that can't actually be produced by the grammar.
      });
    });

    function updateBinariesToArrows(
      node:
        | Expression
        | SpreadElement
        | SequenceExpression
        | false
        | undefined,
      _throw: (msg: string) => void,
    ): void {
      if (!node) {
        return;
      }

      // Traverse the whole subtree first.
      for (const key of Object.keys(node)) {
        const value = (node as unknown as Record<string, unknown>)[key];
        if (value && typeof value === 'object') {
          if (Array.isArray(value)) {
            for (const item of value) {
              updateBinariesToArrows(item as Expression, _throw);
            }
          } else {
            updateBinariesToArrows(value as Expression, _throw);
          }
        }
      }

      const binary = node as unknown as BinaryNode;
      if (binary.operator === '=>') {
        const arrow = node as unknown as ArrowFunctionExpression & {
          left?: Expression;
          right?: Expression;
          operator?: string;
        };
        const left = binary.left;
        let params: Identifier[] = [];
        if (left) {
          const seq = left as unknown as SequenceLike;
          if (seq.type === 'SequenceExpression' && seq.expressions) {
            params = seq.expressions as Identifier[];
          } else {
            params = [left as Identifier];
          }
        }
        // Reject rest parameters (`(...x) => x`) and any other non-Identifier
        // shape with a clear error. Without this guard, a SpreadElement
        // would survive into the evaluator and fail with a generic
        // "Unsupported node type" message.
        for (const param of params) {
          if ((param as { type: string }).type !== 'Identifier') {
            throw new Error(
              `Arrow function parameters must be plain identifiers, got ${
                (param as { type: string }).type
              }`,
            );
          }
        }
        // The body must be a regular Expression (no SpreadElement or
        // transient SequenceExpression). Reject here so the evaluator
        // never receives an arrow whose body would crash it.
        const body = binary.right as { type?: string } | undefined;
        if (
          body &&
          (body.type === 'SpreadElement' ||
            body.type === 'SequenceExpression')
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
    }
  },
};
