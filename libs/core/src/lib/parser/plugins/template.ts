/**
 * Template literal plugin.
 *
 * Adapted from @jsep-plugin/template under MIT license.
 *
 * Supports backtick-delimited template literals with `${expr}` placeholders.
 * Tagged templates are intentionally not supported because the upstream
 * tagged-template branch produces a TaggedTemplateExpression node that is
 * not part of this DSL's AST surface.
 */

import type { Plugin } from '../plugins';
import type { TemplateElement, TemplateLiteral } from '../ast';

const BTICK_CODE = 96; // `
const CCURLY_CODE = 125; // }

export const templatePlugin: Plugin = {
  name: 'template',

  init(jsep) {
    jsep.hooks.add('gobble-token', function gobbleTemplateLiteral(env) {
      if (this.code() !== BTICK_CODE) {
        return;
      }
      const node: TemplateLiteral = {
        type: 'TemplateLiteral',
        quasis: [],
        expressions: [],
      };
      let cooked = '';
      let raw = '';
      let closed = false;
      const length = this.expr.length;

      const pushQuasi = (): void => {
        const element: TemplateElement = {
          type: 'TemplateElement',
          value: { raw, cooked },
          tail: closed,
        };
        node.quasis.push(element);
      };

      while (this.index < length) {
        let ch = this.expr.charAt(++this.index);

        if (ch === '`') {
          this.index += 1;
          closed = true;
          pushQuasi();
          env.node = this.gobbleTokenProperty(node);
          return;
        } else if (
          ch === '$' &&
          this.expr.charAt(this.index + 1) === '{'
        ) {
          this.index += 2;
          pushQuasi();
          raw = '';
          cooked = '';
          const placeholderExprs = this.gobbleExpressions(CCURLY_CODE);
          if (placeholderExprs.length !== 1) {
            this.throwError(
              'Template placeholder must contain exactly one expression',
            );
          }
          const placeholderExpr = placeholderExprs[0];
          if (
            placeholderExpr.type === 'SpreadElement' ||
            placeholderExpr.type === 'SequenceExpression'
          ) {
            this.throwError(
              'Spread and comma sequences are not valid in template literal',
            );
          }
          node.expressions.push(placeholderExpr);
          if (this.code() !== CCURLY_CODE) {
            this.throwError('unclosed ${');
          }
        } else if (ch === '\\') {
          raw += ch;
          ch = this.expr.charAt(++this.index);
          raw += ch;
          switch (ch) {
            case 'n':
              cooked += '\n';
              break;
            case 'r':
              cooked += '\r';
              break;
            case 't':
              cooked += '\t';
              break;
            case 'b':
              cooked += '\b';
              break;
            case 'f':
              cooked += '\f';
              break;
            case 'v':
              cooked += '\x0B';
              break;
            default:
              cooked += ch;
          }
        } else {
          cooked += ch;
          raw += ch;
        }
      }
      this.throwError('Unclosed `');
    });
  },
};
