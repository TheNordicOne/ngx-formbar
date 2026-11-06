/**
 * Ternary (conditional) operator plugin.
 *
 * Adapted from @jsep-plugin/ternary under MIT license.
 *
 * Supports `test ? consequent : alternate`. Precedence is positioned just
 * below `||` so `a || b ? c : d` parses as `(a || b) ? c : d`.
 */

import type { Plugin } from '../plugins';
import type {
  BinaryExpression,
  ConditionalExpression,
  Expression,
  LogicalExpression,
} from '../ast';

function isArrow(node: Expression) {
  return (node as { operator?: string }).operator === '=>';
}

export const ternaryPlugin: Plugin = {
  init(jsep) {
    jsep.hooks.add('after-expression', function gobbleTernary(env) {
      if (!env.node || this.code() !== jsep.QUMARK_CODE) {
        return;
      }
      this.index++;
      const nodeType = (env.node as { type: string }).type;
      if (nodeType === 'SequenceExpression') {
        this.throwError(
          'Ternary test must be a single expression, not a sequence',
        );
      }
      const test = env.node as Expression;
      const consequent = this.gobbleExpression();
      if (!consequent || consequent.type === 'SpreadElement') {
        this.throwError('Expected expression');
      }
      this.gobbleSpaces();

      if (this.code() !== jsep.COLON_CODE) {
        this.throwError('Expected :');
      }
      this.index++;
      const alternate = this.gobbleExpression();
      if (!alternate || alternate.type === 'SpreadElement') {
        this.throwError('Expected expression');
      }

      let conditional: ConditionalExpression = {
        type: 'ConditionalExpression',
        test,
        consequent: consequent as Expression,
        alternate: alternate as Expression,
      };

      // `=>` is still a binary operator here and binds looser than the ternary,
      // so the ternary belongs in the innermost arrow body.
      if (isArrow(test)) {
        let walk = test as BinaryExpression | LogicalExpression;
        while (isArrow(walk.right)) {
          walk = walk.right as BinaryExpression | LogicalExpression;
        }
        conditional = { ...conditional, test: walk.right };
        walk.right = conditional;
        env.node = test;
        return;
      }

      env.node = conditional;
    });
  },
};
