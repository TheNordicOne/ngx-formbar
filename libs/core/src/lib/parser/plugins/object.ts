/**
 * Object literal plugin.
 *
 * Adapted from @jsep-plugin/object under MIT license.
 *
 * Supports `{}`, `{key: value, ...}`, `{[computedKey]: value}`, `{shorthand}`,
 * and `{...spread}` (when the spread plugin is also registered).
 */

import type { Plugin } from '../plugins';
import type {
  Expression,
  ObjectExpression,
  Property,
  SpreadElement,
} from '../ast';

const OCURLY_CODE = 123; // {
const CCURLY_CODE = 125; // }

export const objectPlugin: Plugin = {
  name: 'object',

  init(jsep) {
    jsep.hooks.add('gobble-token', function gobbleObjectExpression(env) {
      if (this.code() !== OCURLY_CODE) {
        return;
      }
      this.index++;
      const properties: (Property | SpreadElement)[] = [];

      while (!isNaN(this.code())) {
        this.gobbleSpaces();
        if (this.code() === CCURLY_CODE) {
          this.index++;
          env.node = this.gobbleTokenProperty({
            type: 'ObjectExpression',
            properties,
          } as ObjectExpression);
          return;
        }

        const key = this.gobbleExpression();
        if (!key) {
          break;
        }

        this.gobbleSpaces();
        if (
          key.type === jsep.IDENTIFIER &&
          (this.code() === jsep.COMMA_CODE || this.code() === CCURLY_CODE)
        ) {
          // shorthand: `{foo}` becomes `{foo: foo}`
          properties.push({
            type: 'Property',
            computed: false,
            key: key as Expression,
            value: key as Expression,
            shorthand: true,
          });
        } else if (this.code() === jsep.COLON_CODE) {
          this.index++;
          const value = this.gobbleExpression();
          if (!value || value.type === 'SpreadElement') {
            this.throwError('unexpected object property');
          }
          // jsep encodes computed keys as a single-element ArrayExpression.
          const isArrayKey = key.type === jsep.ARRAY_EXP;
          properties.push({
            type: 'Property',
            computed: isArrayKey,
            key: isArrayKey
              ? (key as { elements: Expression[] }).elements[0]
              : (key as Expression),
            value: value as Expression,
            shorthand: false,
          });
          this.gobbleSpaces();
        } else {
          // Anything the spread plugin produced (SpreadElement).
          properties.push(key as unknown as SpreadElement);
        }

        if (this.code() === jsep.COMMA_CODE) {
          this.index++;
        }
      }
      this.throwError('missing }');
    });
  },
};
