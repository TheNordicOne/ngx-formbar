import { Injectable } from '@angular/core';
import {
  type ArrayExpression,
  type ArrowFunctionExpression,
  type BinaryExpression,
  type BinaryOperator,
  type CallExpression,
  type ConditionalExpression,
  type Expression,
  type Identifier,
  type LogicalExpression,
  type MemberExpression,
  type ObjectExpression,
  parse,
  type Program,
  type SpreadElement,
  type TemplateLiteral,
  type UnaryExpression,
} from '../../parser';
import type { FormContext } from '../../types/expression.type';
import {
  executeAddition,
  executeEquality,
  executeIn,
  executeNumericBinaryOp,
  executeOrderedComparison,
  isEqualityOperator,
  isOrderedComparisonOperator,
} from './binary-operators';
import { readIndexable } from './canonical-index';
import type { Frame } from './frame';
import { isAllowedMethod, readMethod } from './safe-methods';
import { isObjectLike } from './value-guards';

/**
 * Parses and evaluates a constrained pure-expression DSL against a form
 * context object. The grammar is an allow-list subset of JS expressions
 * with deliberate divergences (strict `==`, throw on div-by-zero,
 * own-property-only identifier and member scope, per-type method
 * allow-list, no mutation reachable).
 *
 * The sandbox protects access and integrity. It does not protect
 * availability: a pathological expression can still hang the host.
 *
 * See `apps/docs/src/docs/fundamentals/expressions/index.md` for the
 * full language reference.
 */
@Injectable({
  providedIn: 'root',
})
export class ExpressionService {
  private static readonly AST_CACHE_LIMIT = 256;

  private readonly astCache = new Map<string, Program>();

  /**
   * Parses an expression string into an AST. Returns null for empty input.
   * Results are cached per source string in a bounded LRU.
   *
   * @param expressionString Source text to parse. Empty or `undefined` input
   *   short-circuits to `null` so callers do not need a separate guard.
   * @returns The parsed {@link Program}, or `null` when there is nothing to
   *   parse. Throws on syntactically invalid or grammatically rejected
   *   input (`a = b`, `this`, multi-statement, etc.).
   */
  parseExpressionToAst(expressionString?: string): Program | null {
    if (!expressionString) {
      return null;
    }
    const cachedAst = this.astCache.get(expressionString);
    if (cachedAst) {
      // Move to tail: most recently used.
      this.astCache.delete(expressionString);
      this.astCache.set(expressionString, cachedAst);
      return cachedAst;
    }

    const ast = parse(expressionString);
    if (this.astCache.size >= ExpressionService.AST_CACHE_LIMIT) {
      // Evict least recently used (head of insertion order).
      const oldestKey = this.astCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.astCache.delete(oldestKey);
      }
    }
    this.astCache.set(expressionString, ast);
    return ast;
  }

  /**
   * Evaluates a parsed AST against the given form context.
   * Returns null when the AST or context is missing.
   *
   * @param ast Program produced by {@link ExpressionService.parseExpressionToAst}.
   * @param context Object whose own properties act as the variables visible
   *   to identifier lookups inside the expression.
   * @returns The evaluated value, or `null` when either argument is missing.
   *   Throws on unsupported syntax or runtime type errors.
   * @typeParam T Expected result type. Defaults to `unknown`.
   */
  evaluateExpression<T = unknown>(
    ast?: Program | null,
    context?: FormContext,
  ): T | null {
    if (!context || !ast) {
      return null;
    }
    return this.evaluateAstNode(ast.body, [context]) as T;
  }

  private evaluateAstNode(
    node: Expression | SpreadElement,
    frames: readonly Frame[],
  ): unknown {
    switch (node.type) {
      case 'Identifier':
        return this.evaluateIdentifier(node, frames);
      case 'Literal':
        return node.value;
      case 'ArrayExpression':
        return this.evaluateArrayExpression(node, frames);
      case 'UnaryExpression':
        return this.evaluateUnaryExpression(node, frames);
      case 'BinaryExpression':
        return this.evaluateBinaryExpression(node, frames);
      case 'LogicalExpression':
        return this.evaluateLogicalExpression(node, frames);
      case 'MemberExpression':
        return this.evaluateMemberExpression(node, frames);
      case 'ConditionalExpression':
        return this.evaluateConditionalExpression(node, frames);
      case 'ObjectExpression':
        return this.evaluateObjectExpression(node, frames);
      case 'TemplateLiteral':
        return this.evaluateTemplateLiteral(node, frames);
      case 'CallExpression':
        return this.evaluateCallExpression(node, frames);
      case 'ArrowFunctionExpression':
        return this.evaluateArrowFunctionExpression(node, frames);
      default:
        throw new TypeError(
          `Unsupported node type: ${(node as { type: string }).type}`,
        );
    }
  }

  private evaluateBinaryExpression(
    node: BinaryExpression,
    frames: readonly Frame[],
  ) {
    const leftValue = this.evaluateAstNode(node.left, frames);
    const rightValue = this.evaluateAstNode(node.right, frames);
    return this.executeBinaryOperation(leftValue, node.operator, rightValue);
  }

  private executeBinaryOperation(
    leftValue: unknown,
    operator: BinaryOperator,
    rightValue: unknown,
  ) {
    if (operator === '+') {
      return executeAddition(leftValue, rightValue);
    }
    if (operator === 'in') {
      return executeIn(leftValue, rightValue);
    }
    if (isEqualityOperator(operator)) {
      return executeEquality(operator, leftValue, rightValue);
    }
    if (isOrderedComparisonOperator(operator)) {
      return executeOrderedComparison(operator, leftValue, rightValue);
    }
    return executeNumericBinaryOp(operator, leftValue, rightValue);
  }

  private evaluateMemberExpression(
    node: MemberExpression,
    frames: readonly Frame[],
  ) {
    const propertyValue = node.computed
      ? this.evaluateAstNode(node.property, frames)
      : (node.property as Identifier).name;

    if (
      typeof propertyValue !== 'string' &&
      typeof propertyValue !== 'number'
    ) {
      throw new Error(
        `Property accessor must be a string or number, but was ${typeof propertyValue}`,
      );
    }

    const objectValue = this.evaluateAstNode(node.object, frames);

    if (objectValue === null || objectValue === undefined) {
      if (node.optional) {
        return undefined;
      }
      const readingFrom =
        node.object.type === 'Identifier' ? ` from ${node.object.name}` : '';
      throw new Error(
        `Cannot access properties of null or undefined (Reading: ${String(propertyValue)}${readingFrom})`,
      );
    }

    if (Array.isArray(objectValue)) {
      return readIndexable('array', objectValue, propertyValue);
    }

    if (typeof objectValue === 'string') {
      return readIndexable('string', objectValue, propertyValue);
    }

    if (typeof objectValue === 'object') {
      // Restrict to own properties so prototype members (`constructor`,
      // `toString`, `hasOwnProperty`, ...) are not reachable through member
      // access. Returning a function reference would expose a callable that
      // bypasses the call gate.
      return Object.prototype.hasOwnProperty.call(objectValue, propertyValue)
        ? (objectValue as Record<string, unknown>)[propertyValue]
        : undefined;
    }

    if (typeof objectValue === 'function') {
      throw new Error(
        `Cannot access properties on a function value: .${String(propertyValue)}`,
      );
    }
    if (typeof objectValue === 'number' || typeof objectValue === 'boolean') {
      throw new Error(
        `Cannot access properties on a ${typeof objectValue} value: ${String(objectValue)}.${String(propertyValue)}`,
      );
    }
    throw new Error(
      `Cannot access properties on a ${typeof objectValue} value: .${String(propertyValue)}`,
    );
  }

  private evaluateIdentifier(node: Identifier, frames: readonly Frame[]) {
    // Walk frames from innermost (last pushed) to outermost so arrow
    // parameters shadow outer-context names.
    for (let i = frames.length - 1; i >= 0; i--) {
      const frame = frames[i];
      if (Object.prototype.hasOwnProperty.call(frame, node.name)) {
        return frame[node.name];
      }
    }
    return undefined;
  }

  private evaluateArrayExpression(
    node: ArrayExpression,
    frames: readonly Frame[],
  ) {
    const resultArray: unknown[] = [];

    for (const element of node.elements) {
      if (element === null) {
        resultArray.push(undefined);
        continue;
      }

      if (element.type !== 'SpreadElement') {
        resultArray.push(this.evaluateAstNode(element, frames));
        continue;
      }

      const spreadValue = this.evaluateAstNode(element.argument, frames);
      if (!Array.isArray(spreadValue)) {
        throw new TypeError(`Cannot spread non-array value in array literal`);
      }
      resultArray.push(...(spreadValue as unknown[]));
    }

    return resultArray;
  }

  private evaluateUnaryExpression(
    node: UnaryExpression,
    frames: readonly Frame[],
  ) {
    const argumentValue = this.evaluateAstNode(node.argument, frames);

    switch (node.operator) {
      case '-':
        if (typeof argumentValue !== 'number') {
          throw new TypeError('Unary - operator requires a number');
        }
        return -argumentValue;

      case '+': {
        if (typeof argumentValue === 'number') {
          return argumentValue;
        }
        if (typeof argumentValue !== 'string') {
          throw new TypeError('Unary + operator requires a number or string');
        }
        const numberValue = Number(argumentValue);
        if (Number.isNaN(numberValue)) {
          throw new TypeError(
            `Cannot convert string "${argumentValue}" to number`,
          );
        }
        return numberValue;
      }

      case '!':
        return !argumentValue;

      case '~':
        if (typeof argumentValue !== 'number') {
          throw new TypeError('Bitwise NOT (~) operator requires a number');
        }
        return ~argumentValue;

      case 'typeof':
        return typeof argumentValue;

      case 'void':
        return undefined;

      default:
        throw new TypeError(
          `Unsupported unary operator: ${(node as { operator: string }).operator}`,
        );
    }
  }

  private evaluateLogicalExpression(
    node: LogicalExpression,
    frames: readonly Frame[],
  ) {
    const leftValue = this.evaluateAstNode(node.left, frames);

    switch (node.operator) {
      case '&&':
        return leftValue ? this.evaluateAstNode(node.right, frames) : leftValue;

      case '||':
        // Implements JS `||`: return left when truthy, else right.
        // `??` would diverge for falsy-but-non-nullish values like 0 or "".
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        return leftValue || this.evaluateAstNode(node.right, frames);

      case '??':
        return leftValue ?? this.evaluateAstNode(node.right, frames);

      default:
        throw new TypeError(
          `Unsupported logical operator: ${(node as { operator: string }).operator}`,
        );
    }
  }

  private evaluateConditionalExpression(
    node: ConditionalExpression,
    frames: readonly Frame[],
  ) {
    return this.evaluateAstNode(node.test, frames)
      ? this.evaluateAstNode(node.consequent, frames)
      : this.evaluateAstNode(node.alternate, frames);
  }

  private evaluateObjectExpression(
    node: ObjectExpression,
    frames: readonly Frame[],
  ) {
    const result: Record<string, unknown> = {};

    for (const property of node.properties) {
      if (property.type === 'SpreadElement') {
        this.applySpreadIntoObject(result, property, frames);
        continue;
      }

      const key =
        property.key.type === 'Identifier' && !property.computed
          ? property.key.name
          : String(this.evaluateAstNode(property.key, frames));

      // Skip __proto__ so the literal `{__proto__: x}` (or `{["__proto__"]: x}`)
      // does not trigger JavaScript's prototype-setter semantics on the
      // returned object. The spread branch applies the same defense.
      if (key === '__proto__') {
        continue;
      }

      result[key] = this.evaluateAstNode(property.value, frames);
    }

    return result;
  }

  private applySpreadIntoObject(
    result: Record<string, unknown>,
    spread: SpreadElement,
    frames: readonly Frame[],
  ) {
    const spreadValue = this.evaluateAstNode(spread.argument, frames);
    if (!isObjectLike(spreadValue)) {
      throw new TypeError(`Cannot spread non-object value in object literal`);
    }
    for (const spreadKey of Object.keys(spreadValue)) {
      // Defensively skip __proto__ so spreading an object with an own
      // "__proto__" property (e.g. from JSON.parse) does not reset the
      // prototype of the returned object.
      if (spreadKey === '__proto__') {
        continue;
      }
      result[spreadKey] = spreadValue[spreadKey];
    }
  }

  private evaluateTemplateLiteral(
    node: TemplateLiteral,
    frames: readonly Frame[],
  ) {
    let result = '';
    for (let i = 0; i < node.quasis.length; i++) {
      result += node.quasis[i].value.cooked;
      if (i < node.expressions.length) {
        result += String(this.evaluateAstNode(node.expressions[i], frames));
      }
    }
    return result;
  }

  private evaluateCallExpression(
    node: CallExpression,
    frames: readonly Frame[],
  ) {
    if (node.callee.type !== 'MemberExpression') {
      throw new TypeError('Only method calls are supported');
    }

    const memberExpr = node.callee;
    const object = this.evaluateAstNode(memberExpr.object, frames);

    if (object === null || object === undefined) {
      if (node.optional ?? memberExpr.optional) {
        return undefined;
      }
      throw new Error('Cannot call methods on null or undefined');
    }

    const methodName = this.resolveMethodName(memberExpr, frames);
    const args = this.evaluateCallArguments(node.arguments, frames);

    return this.callSafeMethod(object, methodName, args);
  }

  private resolveMethodName(
    memberExpr: MemberExpression,
    frames: readonly Frame[],
  ) {
    // Static member access (`o.f`) always carries an Identifier property; the
    // parser's gobbleTokenProperty enforces this. Only the computed form can
    // produce other shapes.
    if (!memberExpr.computed) {
      return (memberExpr.property as Identifier).name;
    }
    const propertyValue = this.evaluateAstNode(memberExpr.property, frames);
    if (
      typeof propertyValue !== 'string' &&
      typeof propertyValue !== 'number'
    ) {
      throw new TypeError('Method name must be a string or number');
    }
    return String(propertyValue);
  }

  private evaluateCallArguments(
    rawArgs: CallExpression['arguments'],
    frames: readonly Frame[],
  ) {
    const args: unknown[] = [];
    for (const arg of rawArgs) {
      if (arg.type !== 'SpreadElement') {
        args.push(this.evaluateAstNode(arg, frames));
        continue;
      }
      const spreadValue = this.evaluateAstNode(arg.argument, frames);
      if (!Array.isArray(spreadValue)) {
        throw new TypeError('Cannot spread non-array value in call arguments');
      }
      for (const item of spreadValue) {
        args.push(item);
      }
    }
    return args;
  }

  private callSafeMethod(object: unknown, methodName: string, args: unknown[]) {
    if (!isAllowedMethod(object, methodName)) {
      throw new TypeError(
        `Method ${methodName} is not supported on type ${typeof object}`,
      );
    }
    // SAFE_METHODS only lists names that exist as functions on the relevant
    // built-in prototype, so readMethod cannot return undefined here.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const method = readMethod(object, methodName)!;
    return method.apply(object, args);
  }

  private evaluateArrowFunctionExpression(
    node: ArrowFunctionExpression,
    frames: readonly Frame[],
  ) {
    const body = node.body;
    return (...args: unknown[]) => {
      // Null-prototype frame so a parameter named `__proto__` is stored as an
      // own property rather than triggering the Object.prototype setter
      // (which would silently lose the binding).
      const paramFrame = Object.create(null) as Frame;
      for (let i = 0; i < node.params.length && i < args.length; i++) {
        paramFrame[node.params[i].name] = args[i];
      }
      return this.evaluateAstNode(body, [...frames, paramFrame]);
    };
  }
}
