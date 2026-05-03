import { Injectable } from '@angular/core';
import type {
  ArrayExpression,
  ArrowFunctionExpression,
  BinaryExpression,
  BinaryOperator,
  CallExpression,
  ConditionalExpression,
  Expression,
  Identifier,
  Literal,
  LogicalExpression,
  MemberExpression,
  ObjectExpression,
  PrivateIdentifier,
  Program,
  SequenceExpression,
  SpreadElement,
  Super,
  TemplateLiteral,
  UnaryExpression,
} from 'acorn';
import * as acorn from 'acorn';
import type { FormContext } from '../types/expression.type';

/**
 * Node types blocked in expressions for security or complexity reasons.
 */
const UNSUPPORTED_NODE_TYPES = new Set([
  'ThisExpression',
  'Super',
  'PrivateIdentifier',
  'FunctionExpression',
  'UpdateExpression',
  'AssignmentExpression',
  'NewExpression',
  'YieldExpression',
  'TaggedTemplateExpression',
  'ClassExpression',
  'MetaProperty',
  'AwaitExpression',
  'ImportExpression',
]);

type SafeMethods = {
  string: string[];
  number: string[];
  boolean: string[];
  array: string[];
};
/**
 * Methods allowed to be called on each primitive type during evaluation.
 */
const SAFE_METHODS: SafeMethods = {
  string: [
    'charAt',
    'concat',
    'includes',
    'endsWith',
    'indexOf',
    'lastIndexOf',
    'padEnd',
    'padStart',
    'repeat',
    'replace',
    'slice',
    'split',
    'startsWith',
    'substring',
    'toLowerCase',
    'toUpperCase',
    'trim',
    'trimEnd',
    'trimStart',
    'toString',
  ],
  number: ['toFixed', 'toPrecision', 'toString'],
  boolean: ['toString'],
  array: [
    'concat',
    'every',
    'filter',
    'find',
    'findIndex',
    'includes',
    'indexOf',
    'join',
    'lastIndexOf',
    'map',
    'reduce',
    'reduceRight',
    'slice',
    'some',
    'toString',
  ],
} as const;

type ObjectWithMethod = Record<string, unknown>;

/**
 * Parses and evaluates a restricted subset of JavaScript expressions
 * against a form context object.
 */
@Injectable({
  providedIn: 'root',
})
export class ExpressionService {
  private readonly astCache = new Map<string, Program>();

  /**
   * Parses an expression string into an AST. Returns null for empty input.
   * Results are cached per source string.
   *
   * @param expressionString Source text to parse. Empty or `undefined` input
   *   short-circuits to `null` so callers do not need a separate guard.
   * @returns The parsed acorn `Program`, or `null` when there is nothing to
   *   parse. Throws when the input is not valid ECMAScript 2022.
   */
  parseExpressionToAst(expressionString?: string): Program | null {
    if (!expressionString) {
      return null;
    }
    const cachedAst = this.astCache.get(expressionString);
    if (cachedAst) {
      return cachedAst;
    }

    const ast = acorn.parse(expressionString, { ecmaVersion: 2022 });
    this.astCache.set(expressionString, ast);
    return ast;
  }

  /**
   * Evaluates a parsed AST against the given form context.
   * Returns null when the AST or context is missing.
   *
   * @param ast Program produced by {@link ExpressionService.parseExpressionToAst}.
   *   Must wrap a single `ExpressionStatement`; other top-level statements
   *   throw.
   * @param context Object whose own properties act as the variables visible
   *   to identifier lookups inside the expression.
   * @returns The evaluated value, or `null` when either argument is missing.
   *   Throws on unsupported syntax or runtime type errors.
   */
  evaluateExpression(ast?: Program | null, context?: FormContext): unknown {
    if (!context || !ast) {
      return null;
    }

    const node = ast.body[0];
    if (node.type !== 'ExpressionStatement') {
      throw new TypeError(`Unsupported statement type: ${node.type}`);
    }

    return this.evaluateAstNode(node.expression, context);
  }

  private evaluateAstNode(
    node: Expression | PrivateIdentifier | Super | SpreadElement,
    context: FormContext,
  ): unknown {
    if (UNSUPPORTED_NODE_TYPES.has(node.type)) {
      throw new TypeError(`${node.type} is not supported in expressions`);
    }

    switch (node.type) {
      case 'Identifier':
        return this.evaluateIdentifier(node, context);
      case 'Literal':
        return this.evaluateLiteral(node);
      case 'ArrayExpression':
        return this.evaluateArrayExpression(node, context);
      case 'UnaryExpression':
        return this.evaluateUnaryExpression(node, context);
      case 'BinaryExpression':
        return this.evaluateBinaryExpression(node, context);
      case 'LogicalExpression':
        return this.evaluateLogicalExpression(node, context);
      case 'MemberExpression':
        return this.evaluateMemberExpression(node, context);
      case 'ConditionalExpression':
        return this.evaluateConditionalExpression(node, context);
      case 'ParenthesizedExpression':
        return this.evaluateAstNode(node.expression, context);
      case 'ObjectExpression':
        return this.evaluateObjectExpression(node, context);
      case 'SequenceExpression':
        return this.evaluateSequenceExpression(node, context);
      case 'TemplateLiteral':
        return this.evaluateTemplateLiteral(node, context);
      case 'CallExpression':
        return this.evaluateCallExpression(node, context);
      case 'ArrowFunctionExpression':
        return this.evaluateArrowFunctionExpression(node, context);
      case 'ChainExpression':
        return this.evaluateAstNode(node.expression, context);
      default:
        throw new TypeError(`Unsupported node type: ${node.type}`);
    }
  }

  private evaluateLiteral(node: Literal): unknown {
    return node.value;
  }

  private evaluateBinaryExpression(
    node: BinaryExpression,
    context: FormContext,
  ): unknown {
    const leftValue = this.evaluateAstNode(node.left, context);
    const rightValue = this.evaluateAstNode(node.right, context);
    return this.executeBinaryOperation(leftValue, node.operator, rightValue);
  }

  private executeBinaryOperation(
    leftValue: unknown,
    operator: BinaryOperator,
    rightValue: unknown,
  ): unknown {
    const isNumber = (value: unknown): value is number =>
      typeof value === 'number';
    const isString = (value: unknown): value is string =>
      typeof value === 'string';
    const isObject = (value: unknown): value is object =>
      value !== null && typeof value === 'object';

    switch (operator) {
      // Arithmetic operators
      case '+':
        if (isNumber(leftValue) && isNumber(rightValue)) {
          return leftValue + rightValue;
        }

        if (isString(leftValue) || isString(rightValue)) {
          return String(leftValue) + String(rightValue);
        }

        throw new TypeError('+ operator requires numbers or strings');

      case '-':
        if (isNumber(leftValue) && isNumber(rightValue)) {
          return leftValue - rightValue;
        }
        throw new TypeError('- operator requires numbers');

      case '*':
        if (isNumber(leftValue) && isNumber(rightValue)) {
          return leftValue * rightValue;
        }
        throw new TypeError('* operator requires numbers');

      case '/':
        if (isNumber(leftValue) && isNumber(rightValue)) {
          if (rightValue === 0) {
            throw new Error('Division by zero');
          }
          return leftValue / rightValue;
        }
        throw new TypeError('/ operator requires numbers');

      case '%':
        if (isNumber(leftValue) && isNumber(rightValue)) {
          if (rightValue === 0) {
            throw new Error('Modulo by zero');
          }
          return leftValue % rightValue;
        }
        throw new TypeError('% operator requires numbers');

      case '**':
        if (isNumber(leftValue) && isNumber(rightValue)) {
          return leftValue ** rightValue;
        }
        throw new TypeError('** operator requires numbers');

      // Comparison operators
      case '<':
        if (
          (isNumber(leftValue) && isNumber(rightValue)) ||
          (isString(leftValue) && isString(rightValue))
        ) {
          return leftValue < rightValue;
        }
        throw new TypeError(
          '< operator requires operands of the same type (numbers or strings)',
        );

      case '>':
        if (
          (isNumber(leftValue) && isNumber(rightValue)) ||
          (isString(leftValue) && isString(rightValue))
        ) {
          return leftValue > rightValue;
        }
        throw new TypeError(
          '> operator requires operands of the same type (numbers or strings)',
        );

      case '<=':
        if (
          (isNumber(leftValue) && isNumber(rightValue)) ||
          (isString(leftValue) && isString(rightValue))
        ) {
          return leftValue <= rightValue;
        }
        throw new TypeError(
          '<= operator requires operands of the same type (numbers or strings)',
        );

      case '>=':
        if (
          (isNumber(leftValue) && isNumber(rightValue)) ||
          (isString(leftValue) && isString(rightValue))
        ) {
          return leftValue >= rightValue;
        }
        throw new TypeError(
          '>= operator requires operands of the same type (numbers or strings)',
        );

      // Equality operators - maintain loose behavior as per specs
      case '==':
        return leftValue == rightValue;
      case '!=':
        return leftValue != rightValue;
      case '===':
        return leftValue === rightValue;
      case '!==':
        return leftValue !== rightValue;

      // Bitwise operators
      case '|':
        if (isNumber(leftValue) && isNumber(rightValue)) {
          return leftValue | rightValue;
        }
        throw new TypeError('| operator requires numbers');

      case '&':
        if (isNumber(leftValue) && isNumber(rightValue)) {
          return leftValue & rightValue;
        }
        throw new TypeError('& operator requires numbers');

      case '^':
        if (isNumber(leftValue) && isNumber(rightValue)) {
          return leftValue ^ rightValue;
        }
        throw new TypeError('^ operator requires numbers');

      case '<<':
        if (isNumber(leftValue) && isNumber(rightValue)) {
          return leftValue << rightValue;
        }
        throw new TypeError('<< operator requires numbers');

      case '>>':
        if (isNumber(leftValue) && isNumber(rightValue)) {
          return leftValue >> rightValue;
        }
        throw new TypeError('>> operator requires numbers');

      case '>>>':
        if (isNumber(leftValue) && isNumber(rightValue)) {
          return leftValue >>> rightValue;
        }
        throw new TypeError('>>> operator requires numbers');

      case 'in':
        if (!isObject(rightValue)) {
          throw new TypeError(
            'Right operand must be an object for "in" operator',
          );
        }
        if (!isString(leftValue)) {
          throw new TypeError(
            'Left operand must be of type string for "in" operator',
          );
        }
        return leftValue in rightValue;

      default:
        throw new Error(`Unsupported binary operator: ${operator}`);
    }
  }

  /**
   * Evaluates a member expression like `obj.prop` or `arr[0]`,
   * including optional chaining and primitive prototype access.
   *
   * @param node Member expression node from acorn. Both static (`a.b`) and
   *   computed (`a[b]`) forms are accepted, with or without `?.`.
   * @param context Form context forwarded when resolving the receiver and any
   *   computed property key.
   * @returns The looked-up property value. `undefined` when optional chaining
   *   short-circuits; throws for null or undefined receivers without `?.` and
   *   for invalid property accesses on numbers or booleans.
   */
  private evaluateMemberExpression(
    node: MemberExpression,
    context: FormContext,
  ): unknown {
    const propertyValue = node.computed
      ? this.evaluateAstNode(node.property, context)
      : (node.property as Identifier).name;

    if (
      typeof propertyValue !== 'string' &&
      typeof propertyValue !== 'number'
    ) {
      throw new Error(
        `Property accessor must be a string or number, but was ${typeof propertyValue}`,
      );
    }

    const objectValue = this.evaluateAstNode(node.object, context);

    const isOptional = node.optional;
    if (objectValue === null || objectValue === undefined) {
      if (isOptional) {
        return undefined;
      }
      const readObject = node.object;
      const readingFrom =
        readObject.type === 'Identifier' ? ` from ${readObject.name}` : '';
      throw new Error(
        `Cannot access properties of null or undefined (Reading: ${propertyValue.toString()}${readingFrom})`,
      );
    }

    if (typeof objectValue === 'object') {
      return this.getPropertyFromObject(
        objectValue as Record<string, unknown>,
        propertyValue,
      );
    }

    if (typeof objectValue === 'string') {
      if (
        propertyValue === 'length' ||
        typeof String.prototype[
          propertyValue as keyof typeof String.prototype
        ] === 'function'
      ) {
        return objectValue[propertyValue as keyof string];
      }

      if (
        typeof propertyValue === 'number' ||
        !Number.isNaN(Number(propertyValue))
      ) {
        return objectValue[propertyValue as keyof typeof objectValue];
      }

      throw new Error(`Invalid property access on string: ${propertyValue}`);
    }

    if (typeof objectValue === 'number') {
      throw new Error(
        `Cannot access properties on a number value: ${String(objectValue)}.${String(propertyValue)}`,
      );
    }

    if (typeof objectValue === 'boolean') {
      throw new Error(
        `Cannot access properties on a boolean value: ${String(objectValue)}.${String(propertyValue)}`,
      );
    }

    return this.getPropertyFromObject(
      objectValue as Record<string, unknown>,
      propertyValue,
    );
  }

  private getPropertyFromObject(
    object: Record<string, unknown> | null | undefined,
    propertyKey: string | number,
  ): unknown {
    return object !== null && object !== undefined
      ? object[propertyKey]
      : undefined;
  }

  private evaluateIdentifier(node: Identifier, context: FormContext): unknown {
    if (typeof context === 'object' && node.name in context) {
      return context[node.name];
    }
    return undefined;
  }

  private evaluateArrayExpression(
    node: ArrayExpression,
    context: FormContext,
  ): unknown[] {
    const resultArray: unknown[] = [];

    for (const element of node.elements) {
      if (element === null) {
        resultArray.push(undefined);
        continue;
      }

      if (element.type !== 'SpreadElement') {
        resultArray.push(this.evaluateAstNode(element, context));
        continue;
      }

      const spreadValue = this.evaluateAstNode(element.argument, context);

      if (Array.isArray(spreadValue)) {
        resultArray.push(...(spreadValue as unknown[]));
        continue;
      }
      throw new TypeError(`Cannot spread non-array value in array literal`);
    }

    return resultArray;
  }

  private evaluateUnaryExpression(
    node: UnaryExpression,
    context: FormContext,
  ): unknown {
    const argumentValue = this.evaluateAstNode(node.argument, context);

    switch (node.operator) {
      case '-':
        if (typeof argumentValue !== 'number') {
          throw new TypeError('Unary - operator requires a number');
        }
        return -argumentValue;

      case '+':
        if (typeof argumentValue === 'string') {
          const numberValue = Number(argumentValue);
          if (Number.isNaN(numberValue)) {
            throw new TypeError(
              `Cannot convert string "${argumentValue}" to number`,
            );
          }
          return numberValue;
        } else if (typeof argumentValue !== 'number') {
          throw new TypeError('Unary + operator requires a number or string');
        }
        return argumentValue;

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

      case 'delete':
        throw new Error('Delete operator is not supported in expressions');
    }
  }

  private evaluateLogicalExpression(
    node: LogicalExpression,
    context: FormContext,
  ): unknown {
    const leftValue = this.evaluateAstNode(node.left, context);

    switch (node.operator) {
      case '&&':
        if (!leftValue) {
          return leftValue;
        }
        return this.evaluateAstNode(node.right, context);

      case '||':
        if (leftValue) {
          return leftValue;
        }
        return this.evaluateAstNode(node.right, context);

      case '??':
        if (leftValue === null || leftValue === undefined) {
          return this.evaluateAstNode(node.right, context);
        }
        return leftValue;
    }
  }

  private evaluateConditionalExpression(
    node: ConditionalExpression,
    context: FormContext,
  ): unknown {
    const condition = this.evaluateAstNode(node.test, context);
    const isConditionTrue = Boolean(condition);

    if (isConditionTrue) {
      return this.evaluateAstNode(node.consequent, context);
    }

    return this.evaluateAstNode(node.alternate, context);
  }

  private evaluateObjectExpression(
    node: ObjectExpression,
    context: FormContext,
  ): object {
    const result: Record<string, unknown> = {};

    for (const property of node.properties) {
      if (property.type !== 'Property') {
        continue;
      }

      const prop = property;

      let key: string;
      if (prop.key.type === 'Identifier' && !prop.computed) {
        key = prop.key.name;
      } else {
        const evaluatedKey = this.evaluateAstNode(prop.key, context);
        key = String(evaluatedKey);
      }

      result[key] = this.evaluateAstNode(prop.value, context);
    }

    return result;
  }

  private evaluateSequenceExpression(
    node: SequenceExpression,
    context: FormContext,
  ): unknown {
    let result: unknown;

    for (const expression of node.expressions) {
      result = this.evaluateAstNode(expression, context);
    }

    return result;
  }

  private evaluateTemplateLiteral(
    node: TemplateLiteral,
    context: FormContext,
  ): string {
    let result = '';

    for (let i = 0; i < node.quasis.length; i++) {
      const cookedValue = node.quasis[i].value.cooked;
      result = result.concat(cookedValue ?? '');
      if (i < node.expressions.length) {
        const exprValue = this.evaluateAstNode(node.expressions[i], context);
        result = result.concat(String(exprValue));
      }
    }

    return result;
  }

  /**
   * Evaluates a method call. Only `object.method(...)` form is supported,
   * and the method must be in the safe list for the receiver type.
   *
   * @param node Call expression node from acorn. Bare function calls and
   *   constructor calls are rejected; the callee must be a member expression.
   * @param context Form context forwarded when resolving the receiver, the
   *   computed method name (when present), and each argument.
   * @returns The result of invoking the resolved method. Throws when the
   *   receiver is null or undefined without optional chaining, or when the
   *   method is not in {@link SAFE_METHODS} for the receiver's type.
   */
  private evaluateCallExpression(
    node: CallExpression,
    context: FormContext,
  ): unknown {
    if (node.callee.type !== 'MemberExpression') {
      throw new TypeError('Only method calls are supported');
    }

    const memberExpr = node.callee;
    const object = this.evaluateAstNode(memberExpr.object, context);

    const isOptionalCall = node.optional || memberExpr.optional;
    if (object === null || object === undefined) {
      if (isOptionalCall) {
        return undefined;
      }
      throw new Error('Cannot call methods on null || undefined');
    }

    let methodName: string;
    if (!memberExpr.computed && memberExpr.property.type === 'Identifier') {
      methodName = memberExpr.property.name;
    } else if (memberExpr.computed) {
      const propertyValue = this.evaluateAstNode(memberExpr.property, context);
      if (
        typeof propertyValue !== 'string' &&
        typeof propertyValue !== 'number'
      ) {
        throw new TypeError('Method name must be a string || number');
      }
      methodName = String(propertyValue);
    } else {
      throw new TypeError('Unexpected property type in method call');
    }

    const args: unknown[] = [];
    for (const arg of node.arguments) {
      args.push(this.evaluateAstNode(arg, context));
    }

    return this.callSafeMethod(object, methodName, args);
  }

  private callSafeMethod(
    object: unknown,
    methodName: string,
    args: unknown[],
  ): unknown {
    const objType: string = typeof object;
    const isAllowed = this.isAllowedMethod(objType, methodName, object);

    if (!isAllowed) {
      throw new TypeError(
        `Method ${methodName} is not supported on type ${objType}`,
      );
    }

    const objectWithMethod = object as ObjectWithMethod;
    const method = objectWithMethod[methodName];

    if (typeof method !== 'function') {
      throw new TypeError(`${methodName} is not a function`);
    }

    return method.apply(object, args);
  }

  private isAllowedMethod(
    objectType: string,
    methodName: string,
    object: unknown,
  ) {
    if (objectType === 'object' && object !== null) {
      const objectWithMethods = object as ObjectWithMethod;
      return (
        methodName in objectWithMethods &&
        typeof objectWithMethods[methodName] === 'function'
      );
    }

    if (!(objectType in SAFE_METHODS)) {
      return false;
    }
    return SAFE_METHODS[objectType as keyof SafeMethods].includes(methodName);
  }

  /**
   * Builds a callable from an arrow function expression.
   * Only expression bodies with simple identifier parameters are supported.
   *
   * @param node Arrow function node from acorn. Block bodies and destructured
   *   or rest parameters are rejected.
   * @param context Outer form context. The returned function shallow-copies it
   *   on each call and binds the arrow's parameters on top so the original
   *   context is never mutated.
   * @returns A function whose call evaluates the arrow body against the
   *   extended context. Useful for higher-order array methods such as
   *   `arr.map(x => x * 2)`.
   */
  private evaluateArrowFunctionExpression(
    node: ArrowFunctionExpression,
    context: FormContext,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  ): Function {
    // We only support simple arrow functions with expression bodies
    if (
      node.body.type !== 'BlockStatement' &&
      node.body.type !== 'Identifier' &&
      node.body.type !== 'MemberExpression' &&
      node.body.type !== 'CallExpression' &&
      node.body.type !== 'BinaryExpression' &&
      node.body.type !== 'LogicalExpression' &&
      node.body.type !== 'TemplateLiteral'
    ) {
      throw new TypeError(
        `Unsupported arrow function body type: ${node.body.type}`,
      );
    }

    return (...args: unknown[]): unknown => {
      const arrowContext = { ...context };

      for (let i = 0; i < node.params.length && i < args.length; i++) {
        const param = node.params[i];
        if (param.type !== 'Identifier') {
          throw new TypeError(
            'Only simple identifier parameters are supported in arrow functions',
          );
        }

        const paramName = param.name;
        arrowContext[paramName] = args[i];
      }

      if (node.body.type !== 'BlockStatement') {
        return this.evaluateAstNode(node.body, arrowContext);
      }

      throw new TypeError('Block-bodied arrow functions are not supported');
    };
  }
}
