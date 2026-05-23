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

export const ternaryPlugin: Plugin = {
  name: 'ternary',

  init(jsep) {
    jsep.hooks.add('after-expression', function gobbleTernary(env) {
      if (!env.node || this.code() !== jsep.QUMARK_CODE) {
        return;
      }
      this.index++;
      if (
        (env.node as { type: string }).type === 'SequenceExpression' ||
        (env.node as { type: string }).type === 'SpreadElement'
      ) {
        this.throwError(
          'Ternary test must be a single expression, not a sequence or spread',
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

      // Re-parent the ternary if the test is a low-precedence binary the
      // ternary should bind tighter than. Mirrors the upstream behaviour for
      // operators below the conditional's precedence.
      const testNode = test as
        | BinaryExpression
        | LogicalExpression
        | Expression;
      if (
        'operator' in testNode &&
        typeof testNode.operator === 'string' &&
        jsep.binary_ops[testNode.operator] !== undefined &&
        jsep.binary_ops[testNode.operator] <= 0.9
      ) {
        let walk = testNode as BinaryExpression | LogicalExpression;
        while (
          'right' in walk &&
          (walk.right as BinaryExpression | LogicalExpression).operator &&
          jsep.binary_ops[
            (walk.right as BinaryExpression | LogicalExpression).operator
          ] !== undefined &&
          jsep.binary_ops[
            (walk.right as BinaryExpression | LogicalExpression).operator
          ] <= 0.9
        ) {
          walk = walk.right as BinaryExpression | LogicalExpression;
        }
        conditional = { ...conditional, test: walk.right };
        walk.right = conditional as unknown as Expression;
        env.node = test;
        return;
      }

      env.node = conditional;
    });
  },
};
