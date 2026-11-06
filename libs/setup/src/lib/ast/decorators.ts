import {
  Expression,
  isIdentifier,
  isPropertyAccessExpression,
} from 'typescript';

export function isCallee(expr: Expression, callee: string): boolean {
  if (isIdentifier(expr)) {
    return expr.text === callee;
  }
  if (isPropertyAccessExpression(expr)) {
    return expr.name.text === callee;
  }
  return false;
}
