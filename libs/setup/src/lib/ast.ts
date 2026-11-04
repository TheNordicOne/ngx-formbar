import {
  CallExpression,
  Expression,
  isArrowFunction,
  isAsExpression,
  isCallExpression,
  isIdentifier,
  isNonNullExpression,
  isNumericLiteral,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isSatisfiesExpression,
  isStringLiteral,
  isVariableStatement,
  ObjectLiteralElementLike,
  ObjectLiteralExpression,
  PropertyName,
  SourceFile,
  VariableDeclaration,
} from 'typescript';

export function findVariableWithObjectLiteral(
  sf: SourceFile,
  expression: (d: VariableDeclaration) => boolean,
): ObjectLiteralExpression | null {
  for (const stmt of sf.statements) {
    if (!isVariableStatement(stmt)) {
      continue;
    }

    const decl = stmt.declarationList.declarations.find(expression);
    if (!decl?.initializer) {
      continue;
    }

    const obj = unwrapToObjectLiteral(decl.initializer);
    if (!obj) {
      continue;
    }

    return obj;
  }

  return null;
}

/**
 * Recursively unwrap common wrappers until we hit an ObjectLiteralExpression.
 * Returns null when the expression never resolves to an object literal.
 */
export function unwrapToObjectLiteral(
  expr: Expression,
): ObjectLiteralExpression | null {
  return isObjectLiteralExpression(expr)
    ? expr
    : isParenthesizedExpression(expr) ||
        isAsExpression(expr) ||
        isSatisfiesExpression(expr) ||
        isNonNullExpression(expr)
      ? unwrapToObjectLiteral(expr.expression)
      : isCallExpression(expr)
        ? objectOfImmediateCall(expr)
        : null;
}

function objectOfImmediateCall({ expression: callee }: CallExpression) {
  const body =
    isParenthesizedExpression(callee) && isArrowFunction(callee.expression)
      ? callee.expression.body
      : undefined;

  return body &&
    isParenthesizedExpression(body) &&
    isObjectLiteralExpression(body.expression)
    ? body.expression
    : null;
}

export function nameOfProperty(
  propertyName: PropertyName | undefined,
): string | null {
  // Computed names don't count for this check.
  return propertyName &&
    (isIdentifier(propertyName) ||
      isStringLiteral(propertyName) ||
      isNumericLiteral(propertyName))
    ? propertyName.text
    : null;
}

export function findProvidersProperty(
  object: ObjectLiteralExpression,
): ObjectLiteralElementLike | undefined {
  return object.properties.find(
    (property) => nameOfProperty(property.name) === 'providers',
  );
}
