/**
 * Vendored expression parser.
 *
 * Adapted from JSEP (https://github.com/EricSmekens/jsep) by Stephen Oney,
 * MIT licensed. See `LICENSE-jsep` in this directory for the original notice.
 *
 * Differences from upstream jsep:
 * - Assignment operator (`=`) is not in the binary operator table, so `a = b`
 *   is a parse error.
 * - The `this` keyword is not recognized; bare `this` is a parse error.
 * - Multi-statement input (`a; b`) and comma-sequence input (`a, b`) are
 *   parse errors. The grammar produces a single expression or throws.
 * - `&&`, `||`, `??` produce `LogicalExpression` nodes instead of
 *   `BinaryExpression`, to support short-circuit evaluation downstream.
 * - The TypeScript port drops the `jsep()` backwards-compatibility shim.
 */

import { Hooks, type HookEnv } from './hooks';
import type { Plugin } from './plugins';
import type {
  Expression,
  Identifier,
  Literal,
  LogicalOperator,
  SequenceExpression,
  SpreadElement,
} from './ast';

// SpreadElement and SequenceExpression are parser-internal transients that
// flow through the machinery to their containers (array/object literal, call
// args, arrow head) but never reach the public Expression surface.
type ParseResult = Expression | SpreadElement | SequenceExpression;

const LOGICAL_OPERATORS: ReadonlySet<string> = new Set(['&&', '||', '??']);

interface BinopInfo {
  value: string;
  prec: number;
  right_a: boolean;
}

export interface ParserStatic {
  hooks: Hooks;
  register(...plugins: Plugin[]): void;

  readonly TAB_CODE: number;
  readonly LF_CODE: number;
  readonly CR_CODE: number;
  readonly SPACE_CODE: number;
  readonly PERIOD_CODE: number;
  readonly COMMA_CODE: number;
  readonly SQUOTE_CODE: number;
  readonly DQUOTE_CODE: number;
  readonly OPAREN_CODE: number;
  readonly CPAREN_CODE: number;
  readonly OBRACK_CODE: number;
  readonly CBRACK_CODE: number;
  readonly QUMARK_CODE: number;
  readonly SEMCOL_CODE: number;
  readonly COLON_CODE: number;

  readonly IDENTIFIER: 'Identifier';
  readonly LITERAL: 'Literal';
  readonly MEMBER_EXP: 'MemberExpression';
  readonly CALL_EXP: 'CallExpression';
  readonly UNARY_EXP: 'UnaryExpression';
  readonly BINARY_EXP: 'BinaryExpression';
  readonly ARRAY_EXP: 'ArrayExpression';

  unary_ops: Record<string, number | undefined>;
  binary_ops: Record<string, number | undefined>;
  right_associative: Set<string>;
  additional_identifier_chars: Set<string>;
  literals: Record<string, unknown>;
  max_unop_len: number;
  max_binop_len: number;

  addUnaryOp(opName: string): ParserStatic;
  addBinaryOp(
    opName: string,
    precedence: number,
    isRightAssociative?: boolean,
  ): ParserStatic;

  isDecimalDigit(ch: number): boolean;
  isIdentifierStart(ch: number): boolean;
  isIdentifierPart(ch: number): boolean;
  binaryPrecedence(opVal: string): number;
}

export class Parser {
  expr: string;
  index = 0;

  constructor(expr: string) {
    this.expr = expr;
  }

  // `char`/`code` are methods (not getters) so TS does not narrow their
  // return type across calls.
  char() {
    return this.expr.charAt(this.index);
  }

  code() {
    return this.expr.charCodeAt(this.index);
  }

  throwError(message: string): never {
    const error = new Error(`${message} at character ${String(this.index)}`);
    (error as Error & { index: number }).index = this.index;
    (error as Error & { description: string }).description = message;
    throw error;
  }

  runHook(name: string, node: ParseResult | false | undefined) {
    if (Parser.hooks.has(name)) {
      const env: HookEnv = { context: this, node };
      Parser.hooks.run(name, env);
      return env.node;
    }
    return node;
  }

  searchHook(name: string) {
    if (Parser.hooks.has(name)) {
      const env: HookEnv = { context: this };
      Parser.hooks.search(name, env);
      return env.node;
    }
    return undefined;
  }

  gobbleSpaces() {
    let ch = this.code();
    while (
      ch === Parser.SPACE_CODE ||
      ch === Parser.TAB_CODE ||
      ch === Parser.LF_CODE ||
      ch === Parser.CR_CODE
    ) {
      ch = this.expr.charCodeAt(++this.index);
    }
    this.runHook('gobble-spaces', undefined);
  }

  /**
   * Parses the input expression and returns a single expression node.
   * Multi-statement and comma-sequence inputs throw at parse time so
   * `(a, b)` and `a; b` cannot reach the evaluator.
   */
  parse(): Expression {
    this.runHook('before-all', undefined);
    const nodes = this.gobbleExpressions();

    if (nodes.length === 0) {
      this.throwError('Empty expression');
    }
    if (nodes.length > 1) {
      this.throwError('Expression must contain exactly one expression');
    }

    let node: ParseResult = nodes[0];
    const hooked = this.runHook('after-all', node);
    if (hooked) {
      node = hooked;
    }
    // SpreadElement and SequenceExpression are parser-internal transients
    // (see ParseResult). If one survives to the public surface, refuse.
    if (node.type === 'SpreadElement') {
      this.throwError(
        'Spread is only valid inside arrays, objects, or call arguments',
      );
    }
    if (node.type === 'SequenceExpression') {
      this.throwError('Comma sequences are not supported');
    }
    return node;
  }

  gobbleExpressions(untilICode?: number): ParseResult[] {
    const nodes: ParseResult[] = [];

    while (this.index < this.expr.length) {
      const chI = this.code();

      if (chI === Parser.SEMCOL_CODE || chI === Parser.COMMA_CODE) {
        this.index++; // ignore separators
        continue;
      }

      const node = this.gobbleExpression();
      if (node) {
        nodes.push(node);
        continue;
      }

      if (this.index >= this.expr.length) {
        break;
      }
      if (chI === untilICode) {
        break;
      }
      this.throwError('Unexpected "' + this.char() + '"');
    }

    return nodes;
  }

  gobbleExpression(): ParseResult | false {
    const hooked = this.searchHook('gobble-expression');
    const node: ParseResult | false = hooked ?? this.gobbleBinaryExpression();
    this.gobbleSpaces();
    const after = this.runHook('after-expression', node);
    return after ?? node;
  }

  gobbleBinaryOp() {
    this.gobbleSpaces();
    let toCheck = this.expr.substring(
      this.index,
      this.index + Parser.max_binop_len,
    );
    let tcLen = toCheck.length;

    while (tcLen > 0) {
      if (
        Object.prototype.hasOwnProperty.call(Parser.binary_ops, toCheck) &&
        (!Parser.isIdentifierStart(this.code()) ||
          (this.index + toCheck.length < this.expr.length &&
            !Parser.isIdentifierPart(
              this.expr.charCodeAt(this.index + toCheck.length),
            )))
      ) {
        this.index += tcLen;
        return toCheck;
      }
      toCheck = toCheck.substring(0, --tcLen);
    }
    return false;
  }

  gobbleBinaryExpression(): ParseResult | false {
    const left = this.gobbleToken();
    if (!left) {
      return left;
    }
    let biop = this.gobbleBinaryOp();
    if (!biop) {
      return left;
    }

    let biopInfo: BinopInfo = {
      value: biop,
      prec: Parser.binaryPrecedence(biop),
      right_a: Parser.right_associative.has(biop),
    };

    const right = this.gobbleToken();
    if (!right) {
      this.throwError('Expected expression after ' + biop);
    }

    // Stack alternates: [ParseResult, BinopInfo, ParseResult, BinopInfo, ...].
    const stack: (ParseResult | BinopInfo)[] = [left, biopInfo, right];

    while ((biop = this.gobbleBinaryOp())) {
      const prec = Parser.binaryPrecedence(biop);
      if (prec === 0) {
        this.index -= biop.length;
        break;
      }
      biopInfo = {
        value: biop,
        prec,
        right_a: Parser.right_associative.has(biop),
      };
      const curBiop = biop;

      const comparePrev = (prev: BinopInfo): boolean =>
        biopInfo.right_a && prev.right_a ? prec > prev.prec : prec <= prev.prec;

      while (stack.length > 2 && comparePrev(stack[stack.length - 2] as BinopInfo)) {
        const right = stack.pop() as ParseResult;
        const op = (stack.pop() as BinopInfo).value;
        const left = stack.pop() as ParseResult;
        // SequenceExpression can legitimately appear as a binary operand
        // (the `=>` operand for `(a, b) => x`). The arrow plugin's
        // after-expression hook expands it; if we narrowed here we'd
        // reject before the hook runs. Survivors are rejected at parse().
        stack.push(
          makeBinaryNode(op, left as Expression, right as Expression),
        );
      }

      const node = this.gobbleToken();
      if (!node) {
        this.throwError('Expected expression after ' + curBiop);
      }
      stack.push(biopInfo, node);
    }

    let i = stack.length - 1;
    let result = stack[i] as ParseResult;
    while (i > 1) {
      result = makeBinaryNode(
        (stack[i - 1] as BinopInfo).value,
        stack[i - 2] as Expression,
        result as Expression,
      );
      i -= 2;
    }
    return result;
  }

  gobbleToken(): ParseResult | false {
    let toCheck: string;
    let tcLen: number;
    let node: ParseResult | false | undefined;

    this.gobbleSpaces();
    const hooked = this.searchHook('gobble-token');
    if (hooked) {
      const after = this.runHook('after-token', hooked);
      return (after ?? hooked) as Expression | false;
    }

    const ch = this.code();

    if (Parser.isDecimalDigit(ch) || ch === Parser.PERIOD_CODE) {
      return this.gobbleNumericLiteral();
    }

    if (ch === Parser.SQUOTE_CODE || ch === Parser.DQUOTE_CODE) {
      node = this.gobbleStringLiteral();
    } else if (ch === Parser.OBRACK_CODE) {
      node = this.gobbleArray();
    } else {
      toCheck = this.expr.substring(
        this.index,
        this.index + Parser.max_unop_len,
      );
      tcLen = toCheck.length;

      while (tcLen > 0) {
        if (
          Object.prototype.hasOwnProperty.call(Parser.unary_ops, toCheck) &&
          (!Parser.isIdentifierStart(this.code()) ||
            (this.index + toCheck.length < this.expr.length &&
              !Parser.isIdentifierPart(
                this.expr.charCodeAt(this.index + toCheck.length),
              )))
        ) {
          this.index += tcLen;
          const argument = this.gobbleToken();
          if (!argument) {
            this.throwError('missing unaryOp argument');
          }
          const unary: Expression = {
            type: 'UnaryExpression',
            operator: toCheck as never,
            argument: asExpression(argument),
            prefix: true,
          };
          const after = this.runHook('after-token', unary);
          return (after ?? unary) as Expression;
        }
        toCheck = toCheck.substring(0, --tcLen);
      }

      if (Parser.isIdentifierStart(ch)) {
        const ident = this.gobbleIdentifier();
        if (Object.prototype.hasOwnProperty.call(Parser.literals, ident.name)) {
          node = {
            type: 'Literal',
            value: Parser.literals[ident.name] as
              | string
              | number
              | boolean
              | null,
            raw: ident.name,
          };
        } else {
          // Refuse to promote `this` to a ThisExpression — this DSL does
          // not bind a receiver.
          if (ident.name === 'this') {
            this.throwError('The `this` keyword is not supported');
          }
          node = ident;
        }
      } else if (ch === Parser.OPAREN_CODE) {
        node = this.gobbleGroup();
      }
    }

    if (!node) {
      const after = this.runHook('after-token', false);
      return (after ?? false) as Expression | false;
    }

    // Skip property access on SequenceExpression — the arrow plugin will
    // expand `(a, b) => x` later; member/call on a sequence is rejected
    // at the top level.
    if (node.type !== 'SequenceExpression') {
      node = this.gobbleTokenProperty(asExpression(node));
    }
    const after = this.runHook('after-token', node);
    return (after ?? node) as Expression;
  }

  gobbleTokenProperty(node: Expression): Expression {
    this.gobbleSpaces();

    let ch = this.code();
    while (
      ch === Parser.PERIOD_CODE ||
      ch === Parser.OBRACK_CODE ||
      ch === Parser.OPAREN_CODE ||
      ch === Parser.QUMARK_CODE
    ) {
      let optional = false;
      if (
        ch === Parser.QUMARK_CODE &&
        this.expr.charCodeAt(this.index + 1) !== Parser.PERIOD_CODE
      ) {
        break;
      }
      if (ch === Parser.QUMARK_CODE) {
        optional = true;
        this.index += 2;
        this.gobbleSpaces();
        ch = this.code();
      }
      this.index++;

      if (ch === Parser.OBRACK_CODE) {
        const property = this.gobbleExpression();
        if (!property) {
          this.throwError('Unexpected "' + this.char() + '"');
        }
        const memberNode: Expression = {
          type: 'MemberExpression',
          computed: true,
          object: node,
          property: asExpression(property),
          ...(optional ? { optional: true } : {}),
        };
        node = memberNode;
        this.gobbleSpaces();
        if (this.code() !== Parser.CBRACK_CODE) {
          this.throwError('Unclosed [');
        }
        this.index++;
      } else if (ch === Parser.OPAREN_CODE) {
        node = {
          type: 'CallExpression',
          arguments: this.gobbleArguments(Parser.CPAREN_CODE),
          callee: node,
          ...(optional ? { optional: true } : {}),
        };
      } else if (ch === Parser.PERIOD_CODE || optional) {
        if (optional) {
          this.index--;
        }
        this.gobbleSpaces();
        node = {
          type: 'MemberExpression',
          computed: false,
          object: node,
          property: this.gobbleIdentifier(),
          ...(optional ? { optional: true } : {}),
        };
      }

      this.gobbleSpaces();
      ch = this.code();
    }

    return node;
  }

  gobbleNumericLiteral(): Literal {
    let number = '';
    let ch: string;

    while (Parser.isDecimalDigit(this.code())) {
      number += this.expr.charAt(this.index++);
    }

    if (this.code() === Parser.PERIOD_CODE) {
      number += this.expr.charAt(this.index++);
      while (Parser.isDecimalDigit(this.code())) {
        number += this.expr.charAt(this.index++);
      }
    }

    ch = this.char();
    if (ch === 'e' || ch === 'E') {
      number += this.expr.charAt(this.index++);
      ch = this.char();
      if (ch === '+' || ch === '-') {
        number += this.expr.charAt(this.index++);
      }
      while (Parser.isDecimalDigit(this.code())) {
        number += this.expr.charAt(this.index++);
      }
      if (!Parser.isDecimalDigit(this.expr.charCodeAt(this.index - 1))) {
        this.throwError('Expected exponent (' + number + this.char() + ')');
      }
    }

    const chCode = this.code();
    if (Parser.isIdentifierStart(chCode)) {
      this.throwError(
        'Variable names cannot start with a number (' + number + this.char() + ')',
      );
    } else if (
      chCode === Parser.PERIOD_CODE ||
      (number.length === 1 && number.charCodeAt(0) === Parser.PERIOD_CODE)
    ) {
      this.throwError('Unexpected period');
    }

    return {
      type: 'Literal',
      value: parseFloat(number),
      raw: number,
    };
  }

  gobbleStringLiteral(): Literal {
    let str = '';
    const startIndex = this.index;
    const quote = this.expr.charAt(this.index++);
    let closed = false;

    while (this.index < this.expr.length) {
      let ch = this.expr.charAt(this.index++);
      if (ch === quote) {
        closed = true;
        break;
      } else if (ch === '\\') {
        ch = this.expr.charAt(this.index++);
        switch (ch) {
          case 'n':
            str += '\n';
            break;
          case 'r':
            str += '\r';
            break;
          case 't':
            str += '\t';
            break;
          case 'b':
            str += '\b';
            break;
          case 'f':
            str += '\f';
            break;
          case 'v':
            str += '\x0B';
            break;
          default:
            str += ch;
        }
      } else {
        str += ch;
      }
    }

    if (!closed) {
      this.throwError('Unclosed quote after "' + str + '"');
    }

    return {
      type: 'Literal',
      value: str,
      raw: this.expr.substring(startIndex, this.index),
    };
  }

  gobbleIdentifier(): Identifier {
    let ch = this.code();
    const start = this.index;

    if (Parser.isIdentifierStart(ch)) {
      this.index++;
    } else {
      this.throwError('Unexpected ' + this.char());
    }

    while (this.index < this.expr.length) {
      ch = this.code();
      if (Parser.isIdentifierPart(ch)) {
        this.index++;
      } else {
        break;
      }
    }
    return {
      type: 'Identifier',
      name: this.expr.slice(start, this.index),
    };
  }

  gobbleArguments(termination: number): (Expression | SpreadElement)[] {
    const args: (Expression | SpreadElement | null)[] = [];
    let closed = false;
    let separatorCount = 0;

    while (this.index < this.expr.length) {
      this.gobbleSpaces();
      const chI = this.code();

      if (chI === termination) {
        closed = true;
        this.index++;
        if (
          termination === Parser.CPAREN_CODE &&
          separatorCount &&
          separatorCount >= args.length
        ) {
          this.throwError('Unexpected token ' + String.fromCharCode(termination));
        }
        break;
      } else if (chI === Parser.COMMA_CODE) {
        this.index++;
        separatorCount++;
        if (
          separatorCount !== args.length &&
          termination === Parser.CPAREN_CODE
        ) {
          this.throwError('Unexpected token ,');
        } else if (
          separatorCount !== args.length &&
          termination === Parser.CBRACK_CODE
        ) {
          for (let arg = args.length; arg < separatorCount; arg++) {
            args.push(null);
          }
        }
      } else if (
        args.length !== separatorCount &&
        separatorCount !== 0
      ) {
        this.throwError('Expected comma');
      } else {
        const node = this.gobbleExpression();
        if (!node) {
          this.throwError('Expected comma');
        }
        if (node.type === 'SequenceExpression') {
          this.throwError('Comma sequences are not supported');
        }
        args.push(node);
      }
    }

    if (!closed) {
      this.throwError('Expected ' + String.fromCharCode(termination));
    }

    return args as (Expression | SpreadElement)[];
  }

  // Unlike upstream jsep, this rejects comma sequences `(a, b)` at the
  // public surface; the only legitimate survivor is the arrow plugin
  // expanding `(a, b) => x` into a multi-param arrow head.
  gobbleGroup(): ParseResult | false {
    this.index++;
    const nodes = this.gobbleExpressions(Parser.CPAREN_CODE);
    if (this.code() !== Parser.CPAREN_CODE) {
      this.throwError('Unclosed (');
    }
    this.index++;
    if (nodes.length === 1) {
      return nodes[0];
    }
    if (nodes.length === 0) {
      return false;
    }
    return {
      type: 'SequenceExpression',
      expressions: nodes.map((n) => asExpression(n)),
    };
  }

  gobbleArray(): Expression {
    this.index++;
    return {
      type: 'ArrayExpression',
      elements: this.gobbleArguments(Parser.CBRACK_CODE) as (
        | Expression
        | SpreadElement
        | null
      )[],
    };
  }

  static hooks = new Hooks();

  static register(...plugins: Plugin[]) {
    for (const plugin of plugins) {
      plugin.init(Parser as unknown as ParserStatic);
    }
  }

  static parse(expr: string): Expression {
    return new Parser(expr).parse();
  }

  static readonly TAB_CODE = 9;
  static readonly LF_CODE = 10;
  static readonly CR_CODE = 13;
  static readonly SPACE_CODE = 32;
  static readonly PERIOD_CODE = 46;
  static readonly COMMA_CODE = 44;
  static readonly SQUOTE_CODE = 39;
  static readonly DQUOTE_CODE = 34;
  static readonly OPAREN_CODE = 40;
  static readonly CPAREN_CODE = 41;
  static readonly OBRACK_CODE = 91;
  static readonly CBRACK_CODE = 93;
  static readonly QUMARK_CODE = 63;
  static readonly SEMCOL_CODE = 59;
  static readonly COLON_CODE = 58;

  static readonly IDENTIFIER = 'Identifier' as const;
  static readonly LITERAL = 'Literal' as const;
  static readonly MEMBER_EXP = 'MemberExpression' as const;
  static readonly CALL_EXP = 'CallExpression' as const;
  static readonly UNARY_EXP = 'UnaryExpression' as const;
  static readonly BINARY_EXP = 'BinaryExpression' as const;
  static readonly ARRAY_EXP = 'ArrayExpression' as const;

  // `=` and `delete` are intentionally absent: this is a pure expression
  // language with no mutation.
  static unary_ops: Record<string, number | undefined> = {
    '-': 1,
    '!': 1,
    '~': 1,
    '+': 1,
    typeof: 1,
    void: 1,
  };

  static binary_ops: Record<string, number | undefined> = {
    '||': 1,
    '??': 1,
    '&&': 2,
    '|': 3,
    '^': 4,
    '&': 5,
    '==': 6,
    '!=': 6,
    '===': 6,
    '!==': 6,
    '<': 7,
    '>': 7,
    '<=': 7,
    '>=': 7,
    in: 7,
    '<<': 8,
    '>>': 8,
    '>>>': 8,
    '+': 9,
    '-': 9,
    '*': 10,
    '/': 10,
    '%': 10,
    '**': 11,
  };

  static right_associative = new Set(['**']);
  static additional_identifier_chars = new Set(['$', '_']);

  static literals: Record<string, unknown> = {
    true: true,
    false: false,
    null: null,
  };

  static max_unop_len = getMaxKeyLen(Parser.unary_ops);
  static max_binop_len = getMaxKeyLen(Parser.binary_ops);

  static addUnaryOp(opName: string): typeof Parser {
    Parser.max_unop_len = Math.max(opName.length, Parser.max_unop_len);
    Parser.unary_ops[opName] = 1;
    return Parser;
  }

  static addBinaryOp(
    opName: string,
    precedence: number,
    isRightAssociative = false,
  ): typeof Parser {
    Parser.max_binop_len = Math.max(opName.length, Parser.max_binop_len);
    Parser.binary_ops[opName] = precedence;
    if (isRightAssociative) {
      Parser.right_associative.add(opName);
    } else {
      Parser.right_associative.delete(opName);
    }
    return Parser;
  }

  static isDecimalDigit(ch: number): boolean {
    return ch >= 48 && ch <= 57;
  }

  static isIdentifierStart(ch: number): boolean {
    return (
      (ch >= 65 && ch <= 90) ||
      (ch >= 97 && ch <= 122) ||
      (ch >= 128 && !Parser.binary_ops[String.fromCharCode(ch)]) ||
      Parser.additional_identifier_chars.has(String.fromCharCode(ch))
    );
  }

  static isIdentifierPart(ch: number): boolean {
    return Parser.isIdentifierStart(ch) || Parser.isDecimalDigit(ch);
  }

  static binaryPrecedence(opVal: string): number {
    return Parser.binary_ops[opVal] ?? 0;
  }
}

function getMaxKeyLen(obj: Record<string, unknown>) {
  return Math.max(0, ...Object.keys(obj).map((k) => k.length));
}

// Narrows ParseResult to Expression, throwing when a parser-internal
// transient (SpreadElement, SequenceExpression) appears where only the
// public surface is allowed.
function asExpression(node: ParseResult) {
  if (node.type === 'SpreadElement') {
    throw new Error('Spread is not valid in this position');
  }
  if (node.type === 'SequenceExpression') {
    throw new Error('Comma sequences are not supported');
  }
  return node;
}

// Short-circuit operators must produce LogicalExpression so the evaluator
// does not eagerly evaluate the right operand.
function makeBinaryNode(
  operator: string,
  left: Expression,
  right: Expression,
): Expression {
  if (LOGICAL_OPERATORS.has(operator)) {
    return {
      type: 'LogicalExpression',
      operator: operator as LogicalOperator,
      left,
      right,
    };
  }
  return {
    type: 'BinaryExpression',
    operator: operator as never,
    left,
    right,
  };
}
