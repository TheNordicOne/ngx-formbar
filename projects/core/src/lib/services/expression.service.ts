import { Injectable } from '@angular/core';
import * as acorn from 'acorn';
import {
  ArrayExpression,
  BinaryExpression,
  BinaryOperator,
  Identifier,
  Literal,
  LogicalExpression,
  MemberExpression,
  PrivateIdentifier,
  Program,
  Super,
  UnaryExpression,
} from 'acorn';
import { FormContext } from '../types/expression.type';

@Injectable({
  providedIn: 'root',
})
export class ExpressionService {
  private astCache = new Map<string, Program>();

  /**
   * Parses an expression string into an abstract syntax tree (AST)
   * @param expressionString The expression to parse
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
   * @param ast The parsed AST to evaluate
   * @param context The context containing variables and objects referenced in the expression
   * @returns The result of evaluating the expression
   */
  evaluateExpression(ast: Program, context?: FormContext): unknown {
    if (!context) {
      return null;
    }
    const node = ast.body[0];
    if (node.type !== 'ExpressionStatement') {
      throw TypeError(`Unsupported statement type: ${node.type}`);
    }

    return this.evaluateAstNode(node.expression, context);
  }

  /**
   * Evaluates a node in the AST
   * @param node The AST node to evaluate
   * @param context The context containing variables and objects
   * @returns The result of evaluating the node
   */
  private evaluateAstNode(
    node: acorn.Expression | PrivateIdentifier | Super,
    context: FormContext,
  ): unknown {
    if (node.type === 'PrivateIdentifier') {
      throw TypeError('Private identifiers are not supported in expressions');
    }

    if (node.type === 'Super') {
      throw TypeError('Super keyword is not supported in expressions');
    }

    if (node.type === 'ThisExpression') {
      throw TypeError('This keyword is not supported in expressions');
    }

    switch (node.type) {
      case 'Identifier':
        return this.evaluateIdentifier(node, context);
      case 'Literal':
        return this.evaluateLiteral(node);
      case 'ArrayExpression':
        return this.evaluateArrayExpression(node, context);
      case 'ObjectExpression':
        break;
      case 'FunctionExpression':
        break;
      case 'UnaryExpression':
        return this.evaluateUnaryExpression(node, context);
      case 'UpdateExpression':
        break;
      case 'BinaryExpression':
        return this.evaluateBinaryExpression(node, context);
      case 'AssignmentExpression':
        break;
      case 'LogicalExpression':
        return this.evaluateLogicalExpression(node, context);
      case 'MemberExpression':
        return this.evaluateMemberExpression(node, context);
      case 'ConditionalExpression':
        break;
      case 'CallExpression':
        break;
      case 'NewExpression':
        break;
      case 'SequenceExpression':
        break;
      case 'ArrowFunctionExpression':
        break;
      case 'YieldExpression':
        break;
      case 'TemplateLiteral':
        break;
      case 'TaggedTemplateExpression':
        break;
      case 'ClassExpression':
        break;
      case 'MetaProperty':
        break;
      case 'AwaitExpression':
        break;
      case 'ChainExpression':
        break;
      case 'ImportExpression':
        break;
      case 'ParenthesizedExpression':
        break;
    }
    return null;
  }

  /**
   * Evaluates a literal value node
   * @param node The literal node to evaluate
   * @returns The literal value
   */
  private evaluateLiteral(node: Literal) {
    return node.value;
  }

  /**
   * Evaluates a binary expression (e.g., a + b, x > y)
   * @param node The binary expression node
   * @param context The context containing variables and objects
   * @returns The result of the binary operation
   */
  private evaluateBinaryExpression(
    node: BinaryExpression,
    context: FormContext,
  ) {
    const leftNode = node.left;
    const rightNode = node.right;

    const leftValue = this.evaluateAstNode(leftNode, context);
    const rightValue = this.evaluateAstNode(rightNode, context);
    return this.executeBinaryOperation(leftValue, node.operator, rightValue);
  }

  /**
   * Executes a binary operation with the given values and operator
   * @param leftValue The left operand
   * @param operator The binary operator
   * @param rightValue The right operand
   * @returns The result of applying the operator to the operands
   */
  private executeBinaryOperation(
    leftValue: unknown,
    operator: BinaryOperator,
    rightValue: unknown,
  ) {
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

      case '==':
        return leftValue == rightValue;
      case '!=':
        return leftValue != rightValue;
      case '===':
        return leftValue === rightValue;
      case '!==':
        return leftValue !== rightValue;

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
        if (!isObject(rightValue) || !isString(leftValue)) {
          throw new TypeError(
            'Right operand must be an object for "in" operator and left operand must be of type string',
          );
        }
        return leftValue in rightValue;
      default:
        throw new Error(`Unsupported binary operator: ${operator}`);
    }
  }

  /**
   * Evaluates a member expression (e.g., obj.prop, arr[0])
   * @param node The member expression node
   * @param context The context containing variables and objects
   * @returns The value of the member
   */
  private evaluateMemberExpression(
    node: MemberExpression,
    context: FormContext,
  ) {
    const objectValue = this.evaluateAstNode(node.object, context);

    if (objectValue === null || objectValue === undefined) {
      throw new Error('Cannot access properties of null or undefined');
    }

    const propertyValue = this.evaluateAstNode(node.property, context);

    if (
      typeof propertyValue !== 'string' &&
      typeof propertyValue !== 'number'
    ) {
      throw Error(
        `Property accessor must be a string or number, but was ${typeof propertyValue}`,
      );
    }

    if (typeof objectValue === 'object') {
      return this.getPropertyFromObject(
        objectValue as Record<string, unknown>,
        propertyValue,
      );
    }

    if (typeof objectValue !== 'string' && typeof objectValue !== 'number') {
      throw Error(
        `Object must be a string, number, or object, but was ${typeof propertyValue}`,
      );
    }

    const parentObject = this.getPropertyFromObject(context, objectValue);

    if (!parentObject || typeof parentObject !== 'object') {
      return parentObject;
    }

    return parentObject[propertyValue as keyof typeof parentObject];
  }

  /**
   * Gets a property from an object by key
   * @param object The object to retrieve the property from
   * @param propertyKey The property key (string or number)
   * @returns The value of the property
   */
  private getPropertyFromObject(
    object: Record<string, unknown>,
    propertyKey: string | number,
  ) {
    return object[propertyKey];
  }

  /**
   * Evaluates an identifier node by looking it up in the context
   * @param node The identifier node
   * @param context The context containing variables and objects
   * @returns The value of the identifier from the context
   */
  private evaluateIdentifier(node: Identifier, context: FormContext): unknown {
    if (typeof context === 'object' && node.name in context) {
      return context[node.name];
    }
    return node.name;
  }

  /**
   * Evaluates an array expression node
   * @param node The array expression node
   * @param context The context containing variables and objects
   * @returns The evaluated array
   */
  private evaluateArrayExpression(node: ArrayExpression, context: FormContext) {
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
   * @param node The unary expression node
   * @param context The context containing variables and objects
   * @returns The result of the unary operation
   */
  private evaluateUnaryExpression(
    node: UnaryExpression,
    context: FormContext,
  ): unknown {
    const argumentValue = this.evaluateAstNode(node.argument, context);
    console.log(argumentValue);
    switch (node.operator) {
      case '-':
        if (typeof argumentValue !== 'number') {
          throw new TypeError('Unary - operator requires a number');
        }
        return -argumentValue;

      case '+':
        if (typeof argumentValue === 'string') {
          const numberValue = Number(argumentValue);
          if (isNaN(numberValue)) {
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
   * @param node The logical expression node
   * @param context The context containing variables and objects
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
}
