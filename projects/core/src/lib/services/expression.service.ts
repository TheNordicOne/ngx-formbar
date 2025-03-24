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
 * Set of node types that are not supported in expressions for security or complexity reasons
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
  'ChainExpression',
  'ImportExpression',
]);

type SafeMethods = {
  string: string[];
  number: string[];
  boolean: string[];
  array: string[];
};
/**
 * Mapping of safe methods that can be called on various types during evaluation
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
 * Service for parsing and evaluating JavaScript expressions within a context object
 */
@Injectable({
  providedIn: 'root',
})
export class ExpressionService {
  /**
   * Cache for parsed ASTs to avoid re-parsing the same expression
   */
  private readonly astCache = new Map<string, Program>();

  /**
   * Parses an expression string into an abstract syntax tree (AST)
   * @param expressionString - The expression to parse
   * @returns The parsed AST
   */
  parseExpressionToAst(expressionString: string): Program {
    const cachedAst = this.astCache.get(expressionString);
    if (cachedAst) {
      return cachedAst;
    }

    const ast = acorn.parse(expressionString, { ecmaVersion: 2022 });
    this.astCache.set(expressionString, ast);
    return ast;
  }

  /**
   * Evaluates an expression AST within the provided context
   * @param ast - The parsed AST to evaluate
   * @param context - The context containing variables and objects referenced in the expression
   * @returns The result of evaluating the expression
   */
  evaluateExpression(ast: Program, context?: FormContext): unknown {
    if (!context) {
      return null;
    }

    const node = ast.body[0];
    if (node.type !== 'ExpressionStatement') {
      throw new TypeError(`Unsupported statement type: ${node.type}`);
    }

    return this.evaluateAstNode(node.expression, context);
  }

  /**
   * Evaluates a node in the AST
   * @param node - The AST node to evaluate
   * @param context - The context containing variables and objects
   * @returns The result of evaluating the node
   */
  private evaluateAstNode(
    node: Expression | PrivateIdentifier | Super | SpreadElement,
    context: FormContext,
  ): unknown {
    // Check if the node type is unsupported first
    if (UNSUPPORTED_NODE_TYPES.has(node.type)) {
      throw new TypeError(`${node.type} is not supported in expressions`);
    }

    // Handle supported node types
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
      default:
        throw new TypeError(`Unsupported node type: ${node.type}`);
    }
  }

  /**
   * Evaluates a literal value node
   * @param node - The literal node to evaluate
   * @returns The literal value
   */
  private evaluateLiteral(node: Literal): unknown {
    return node.value;
  }

  /**
   * Evaluates a binary expression (e.g., a + b, x > y)
   * @param node - The binary expression node
   * @param context - The context containing variables and objects
   * @returns The result of the binary operation
   */
  private evaluateBinaryExpression(
    node: BinaryExpression,
    context: FormContext,
  ): unknown {
    const leftValue = this.evaluateAstNode(node.left, context);
    const rightValue = this.evaluateAstNode(node.right, context);
    return this.executeBinaryOperation(leftValue, node.operator, rightValue);
  }

  /**
   * Executes a binary operation with the given values and operator
   * @param leftValue - The left operand
   * @param operator - The binary operator
   * @param rightValue - The right operand
   * @returns The result of applying the operator to the operands
   */
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
   * Evaluates a member expression (e.g., obj.prop, arr[0]) with improved safety
   * @param node - The member expression node
   * @param context - The context containing variables and objects
   * @returns The value of the member
   */
  private evaluateMemberExpression(
    node: MemberExpression,
    context: FormContext,
  ): unknown {
    const objectValue = this.evaluateAstNode(node.object, context);

    if (objectValue === null || objectValue === undefined) {
      throw new Error('Cannot access properties of null or undefined');
    }

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

      throw new Error(
        `Invalid property access on string: ${String(propertyValue)}`,
      );
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

    throw new Error(`Cannot access properties on type: ${typeof objectValue}`);
  }

  /**
   * Gets a property from an object by key
   * @param object - The object to retrieve the property from
   * @param propertyKey - The property key (string or number)
   * @returns The value of the property
   */
  private getPropertyFromObject(
    object: Record<string, unknown>,
    propertyKey: string | number,
  ): unknown {
    return object[propertyKey];
  }

  /**
   * Evaluates an identifier node by looking it up in the context
   * @param node - The identifier node
   * @param context - The context containing variables and objects
   * @returns The value of the identifier from the context
   */
  private evaluateIdentifier(node: Identifier, context: FormContext): unknown {
    if (typeof context === 'object' && node.name in context) {
      return context[node.name];
    }
    return undefined;
  }

  /**
   * Evaluates an array expression node
   * @param node - The array expression node
   * @param context - The context containing variables and objects
   * @returns The evaluated array
   */
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

  /**
   * Evaluates a unary expression (e.g., !x, -value, typeof obj)
   * @param node - The unary expression node
   * @param context - The context containing variables and objects
   * @returns The result of the unary operation
   */
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
        return +argumentValue;

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

  /**
   * Evaluates a logical expression (&&, ||, ??)
   * @param node - The logical expression node
   * @param context - The context containing variables and objects
   * @returns The result of the logical operation
   */
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

  /**
   * Evaluates a conditional (ternary) expression (condition ? trueValue : falseValue)
   * @param node - The conditional expression node
   * @param context - The context containing variables and objects
   * @returns The result based on the condition evaluation
   */
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

  /**
   * Evaluates an object expression (object literal)
   * @param node - The object expression node
   * @param context - The context containing variables and objects
   * @returns The evaluated object
   */
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

  /**
   * Evaluates a sequence expression (comma-separated expressions)
   * @param node - The sequence expression node
   * @param context - The context containing variables and objects
   * @returns The result of the last expression in the sequence
   */
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

  /**
   * Evaluates a template literal
   * @param node - The template literal node
   * @param context - The context containing variables and objects
   * @returns The evaluated template string
   */
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
   * Evaluates a function call expression with strict type checking
   * @param node - The function call expression node
   * @param context - The context containing variables and objects
   * @returns The result of the function call
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

    if (object === null || object === undefined) {
      throw new Error('Cannot call methods on null or undefined');
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
        throw new TypeError('Method name must be a string or number');
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

  /**
   * Calls a method on an object after verifying it's safe to do so
   * @param object - The object to call the method on
   * @param methodName - The name of the method to call
   * @param args - The arguments to pass to the method
   * @returns The result of the method call
   */
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
   * Evaluates an arrow function expression
   * @param node - The arrow function expression node
   * @param context - The context containing variables and objects
   * @returns A function that can be called from other expressions
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
