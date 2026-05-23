/**
 * Spread plugin.
 *
 * Adapted from @jsep-plugin/spread under MIT license.
 *
 * Supports `...x` inside array literals, object literals, and function
 * call argument lists.
 */

import type { Plugin } from '../plugins';
import type { SpreadElement } from '../ast';

export const spreadPlugin: Plugin = {
  name: 'spread',

  init(jsep) {
    jsep.hooks.add('gobble-token', function gobbleSpread(env) {
      if (
        [0, 1, 2].every(
          (i) => this.expr.charCodeAt(this.index + i) === jsep.PERIOD_CODE,
        )
      ) {
        this.index += 3;
        const argument = this.gobbleExpression();
        if (
          !argument ||
          argument.type === 'SpreadElement' ||
          argument.type === 'SequenceExpression'
        ) {
          this.throwError('Expected expression after ...');
        }
        const node: SpreadElement = {
          type: 'SpreadElement',
          argument,
        };
        env.node = node;
      }
    });
  },
};
