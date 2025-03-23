import { Injectable } from '@angular/core';
import * as acorn from 'acorn';
import {
  ArrayExpression,
  BinaryExpression,
  BinaryOperator,
  Identifier,
  Literal,
  MemberExpression,
  PrivateIdentifier,
  Program,
  Super,
} from 'acorn';
import { FormContext } from '../types/expression.type';

@Injectable({
  providedIn: 'root',
})
export class ExpressionService {
  private cache = new Map<string, Program>();

  buildExpressionAst(expression: string): Program {
    const cachedAst = this.cache.get(expression);
    if (cachedAst) {
      return cachedAst;
    }

    const ast = acorn.parse(expression, { ecmaVersion: 2022 });
    this.cache.set(expression, ast);
    return ast;
  }

  evaluate(ast: Program, context?: FormContext): unknown {
    if (!context) {
      return null;
    }
    const node = ast.body[0];
    if (node.type !== 'ExpressionStatement') {
      throw TypeError(`Unsupported type ${node.type}`);
    }

    return this.evaluateNode(node.expression, context);
  }

  private evaluateNode(
    node: acorn.Expression | PrivateIdentifier | Super,
    context: FormContext,
  ): unknown {
    if (node.type === 'PrivateIdentifier') {
      throw TypeError('Cannot use private identifiers');
    }

    if (node.type === 'Super') {
      throw TypeError('super keyword is not supported');
    }

    if (node.type === 'ThisExpression') {
      throw TypeError('ThisExpression is not supported');
    }

    switch (node.type) {
      case 'Identifier':
        return this.identifier(node);
      case 'Literal':
        return this.literal(node);
      case 'ArrayExpression':
        return this.evaluateArray(node, context);
      case 'ObjectExpression':
        break;
      case 'FunctionExpression':
        break;
      case 'UnaryExpression':
        break;
      case 'UpdateExpression':
        break;
      case 'BinaryExpression':
        return this.binary(node, context);
      case 'AssignmentExpression':
        break;
      case 'LogicalExpression':
        break;
      case 'MemberExpression':
        return this.member(node, context);
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

  private literal(node: Literal) {
    return node.value;
  }

  private binary(node: BinaryExpression, context: FormContext) {
    const leftNode = node.left;
    const rightNode = node.right;

    const left = this.evaluateNode(leftNode, context);
    const right = this.evaluateNode(rightNode, context);
    return this.applyOperator(left, node.operator, right);
  }

  private applyOperator(
    left: unknown,
    operator: BinaryOperator,
    right: unknown,
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
        if (isNumber(left) && isNumber(right)) {
          return left + right;
        }

        if (isString(left) || isString(right)) {
          return String(left) + String(right);
        }

        throw new TypeError('+ operator requires numbers or strings');

      case '-':
        if (isNumber(left) && isNumber(right)) {
          return left - right;
        }
        throw new TypeError('- operator requires numbers');

      case '*':
        if (isNumber(left) && isNumber(right)) {
          return left * right;
        }
        throw new TypeError('* operator requires numbers');

      case '/':
        if (isNumber(left) && isNumber(right)) {
          if (right === 0) {
            throw new Error('Division by zero');
          }
          return left / right;
        }
        throw new TypeError('/ operator requires numbers');

      case '%':
        if (isNumber(left) && isNumber(right)) {
          if (right === 0) {
            throw new Error('Modulo by zero');
          }
          return left % right;
        }
        throw new TypeError('% operator requires numbers');

      case '**':
        if (isNumber(left) && isNumber(right)) {
          return left ** right;
        }
        throw new TypeError('** operator requires numbers');

      // Comparison operators
      case '<':
        if (
          (isNumber(left) && isNumber(right)) ||
          (isString(left) && isString(right))
        ) {
          return left < right;
        }
        throw new TypeError(
          '< operator requires operands of the same type (numbers or strings)',
        );

      case '>':
        if (
          (isNumber(left) && isNumber(right)) ||
          (isString(left) && isString(right))
        ) {
          return left > right;
        }
        throw new TypeError(
          '> operator requires operands of the same type (numbers or strings)',
        );

      case '<=':
        if (
          (isNumber(left) && isNumber(right)) ||
          (isString(left) && isString(right))
        ) {
          return left <= right;
        }
        throw new TypeError(
          '<= operator requires operands of the same type (numbers or strings)',
        );

      case '>=':
        if (
          (isNumber(left) && isNumber(right)) ||
          (isString(left) && isString(right))
        ) {
          return left >= right;
        }
        throw new TypeError(
          '>= operator requires operands of the same type (numbers or strings)',
        );

      case '==':
        return left == right;
      case '!=':
        return left != right;
      case '===':
        return left === right;
      case '!==':
        return left !== right;

      case '|':
        if (isNumber(left) && isNumber(right)) {
          return left | right;
        }
        throw new TypeError('| operator requires numbers');

      case '&':
        if (isNumber(left) && isNumber(right)) {
          return left & right;
        }
        throw new TypeError('& operator requires numbers');

      case '^':
        if (isNumber(left) && isNumber(right)) {
          return left ^ right;
        }
        throw new TypeError('^ operator requires numbers');

      case '<<':
        if (isNumber(left) && isNumber(right)) {
          return left << right;
        }
        throw new TypeError('<< operator requires numbers');

      case '>>':
        if (isNumber(left) && isNumber(right)) {
          return left >> right;
        }
        throw new TypeError('>> operator requires numbers');

      case '>>>':
        if (isNumber(left) && isNumber(right)) {
          return left >>> right;
        }
        throw new TypeError('>>> operator requires numbers');

      case 'in':
        if (!isObject(right) || !isString(left)) {
          throw new TypeError(
            'Right operand must be an object for "in" operator and left operand must be of type string',
          );
        }
        return left in right;
      default:
        throw new Error(`Unsupported binary operator: ${operator}`);
    }
  }

  private member(node: MemberExpression, context: FormContext) {
    const object = this.evaluateNode(node.object, context);

    if (object === null || object === undefined) {
      throw new Error('Cannot access properties of null or undefined');
    }

    const property = this.evaluateNode(node.property, context);

    if (typeof property !== 'string' && typeof property !== 'number') {
      throw Error(
        `Property has to be a string or number, but was ${typeof property}`,
      );
    }

    if (typeof object === 'object') {
      return this.getObjectProperty(
        object as Record<string, unknown>,
        property,
      );
    }

    if (typeof object !== 'string' && typeof object !== 'number') {
      throw Error(
        `Object has to be a string or number, but was ${typeof property}`,
      );
    }

    const parent = this.getObjectProperty(context, object);

    if (!parent || typeof parent !== 'object') {
      return parent;
    }

    return parent[property as keyof typeof parent];
  }

  private getObjectProperty(
    object: Record<string, unknown>,
    property: string | number,
  ) {
    return object[property];
  }

  private identifier(node: Identifier) {
    return node.name;
  }

  private evaluateArray(node: ArrayExpression, context: FormContext) {
    const result: unknown[] = [];

    for (const element of node.elements) {
      if (element === null) {
        result.push(undefined);
        continue;
      }

      if (element.type !== 'SpreadElement') {
        result.push(this.evaluateNode(element, context));
        continue;
      }

      const spreadValue = this.evaluateNode(element.argument, context);

      if (Array.isArray(spreadValue)) {
        result.push(...(spreadValue as unknown[]));
        continue;
      }
      throw new TypeError(`Cannot spread non-array value in array literal`);
    }

    return result;
  }
}
