/**
 * Regex literal plugin.
 *
 * Adapted from @jsep-plugin/regex under MIT license.
 *
 * Supports `/pattern/flags` literals. The parsed RegExp object is stored as
 * the value of a Literal node; downstream methods like
 * `String.prototype.replace` accept it directly.
 */

import type { Plugin } from '../plugins';
import type { Literal } from '../ast';

const FSLASH_CODE = 47; // '/'
const BSLASH_CODE = 92; // '\\'

export const regexPlugin: Plugin = {
  name: 'regex',

  init(jsep) {
    jsep.hooks.add('gobble-token', function gobbleRegexLiteral(env) {
      if (this.code() !== FSLASH_CODE) {
        return;
      }
      const patternIndex = ++this.index;

      let inCharSet = false;
      while (this.index < this.expr.length) {
        if (this.code() === FSLASH_CODE && !inCharSet) {
          const pattern = this.expr.slice(patternIndex, this.index);

          let flags = '';
          while (++this.index < this.expr.length) {
            const code = this.code();
            if (
              (code >= 97 && code <= 122) ||
              (code >= 65 && code <= 90) ||
              (code >= 48 && code <= 57)
            ) {
              flags += this.char();
            } else {
              break;
            }
          }

          let value: RegExp;
          try {
            value = new RegExp(pattern, flags);
          } catch (e) {
            this.throwError((e as Error).message);
          }

          const node: Literal = {
            type: 'Literal',
            value,
            raw: this.expr.slice(patternIndex - 1, this.index),
          };
          env.node = this.gobbleTokenProperty(node);
          return;
        }
        if (this.code() === jsep.OBRACK_CODE) {
          inCharSet = true;
        } else if (inCharSet && this.code() === jsep.CBRACK_CODE) {
          inCharSet = false;
        }
        this.index += this.code() === BSLASH_CODE ? 2 : 1;
      }
      this.throwError('Unclosed Regex');
    });
  },
};
