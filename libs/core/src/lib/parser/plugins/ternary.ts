/**
 * Ternary (conditional) operator plugin.
 *
 * Adapted from @jsep-plugin/ternary under MIT license.
 *
 * Supports `test ? consequent : alternate`. Precedence is positioned just
 * below `||` so `a || b ? c : d` parses as `(a || b) ? c : d`.
 */

import type { Plugin } from '../plugins';
import type { ParserStatic } from '../core';
import type {
  BinaryExpression,
  ConditionalExpression,
  Expression,
  LogicalExpression,
} from '../ast';

function getOpPrecedence(jsep: ParserStatic, node: Expression) {
  const operator = (node as { operator?: string }).operator;
  if (operator === undefined) {
    return undefined;
  }
  return jsep.binary_ops[operator];
}

export const ternaryPlugin: Plugin = {
  name: 'ternary',

  init(jsep) {
    jsep.hooks.add('after-expression', function gobbleTernary(env) {
      if (!env.node || this.code() !== jsep.QUMARK_CODE) {
        return;
      }
      this.index++;
      const nodeType = (env.node as { type: string }).type;
      if (nodeType === 'SequenceExpression' || nodeType === 'SpreadElement') {
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

      // Re-parent when the test is a low-precedence binary the ternary
      // should bind tighter than (mirrors upstream jsep).
      const testPrecedence = getOpPrecedence(jsep, test);
      if (testPrecedence !== undefined && testPrecedence <= 0.9) {
        let walk = test as BinaryExpression | LogicalExpression;
        let rightPrecedence = getOpPrecedence(jsep, walk.right);
        while (rightPrecedence !== undefined && rightPrecedence <= 0.9) {
          walk = walk.right as BinaryExpression | LogicalExpression;
          rightPrecedence = getOpPrecedence(jsep, walk.right);
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
