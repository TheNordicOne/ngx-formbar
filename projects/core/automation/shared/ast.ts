import {
  AsExpression,
  CallExpression,
  Expression,
  isArrowFunction,
  isIdentifier,
  isNumericLiteral,
  isObjectLiteralExpression,
  isParenthesizedExpression,
  isStringLiteral,
  isVariableStatement,
  Node,
  NonNullExpression,
  ObjectLiteralExpression,
  ParenthesizedExpression,
  PropertyName,
  SatisfiesExpression,
  SourceFile,
  SyntaxKind,
  VariableDeclaration,
} from 'typescript';

export function findVariableWithObjectLiteral(
  sf: SourceFile,
  expression: (d: VariableDeclaration) => boolean,
) {
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
export function unwrapToObjectLiteral(expr: Expression) {
  let current: Expression | undefined = expr;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    if (isObjectLiteralExpression(current)) {
      return current;
    }

    switch (current.kind) {
      case SyntaxKind.ParenthesizedExpression:
        current = (current as ParenthesizedExpression).expression;
        continue;
      case SyntaxKind.AsExpression:
        current = (current as AsExpression).expression;
        continue;
      case SyntaxKind.SatisfiesExpression:
        current = (current as SatisfiesExpression).expression;
        continue;
      case SyntaxKind.NonNullExpression:
        current = (current as NonNullExpression).expression;
        continue;
      case SyntaxKind.CallExpression: {
        const call = current as CallExpression;
        const callee = call.expression;
        if (
          isParenthesizedExpression(callee) &&
          isArrowFunction(callee.expression)
        ) {
          const body = callee.expression.body;
          if (
            isParenthesizedExpression(body) &&
            isObjectLiteralExpression(body.expression)
          ) {
            return body.expression;
          }
        }
        return null;
      }
      default:
        return null;
    }
  }
}

export function isObjectLiteral(node: Node): node is ObjectLiteralExpression {
  return isObjectLiteralExpression(node);
}

export function nameOfProperty(propertyName: PropertyName | undefined) {
  if (!propertyName) {
    return null;
  }
  return isIdentifier(propertyName)
    ? propertyName.text
    : isStringLiteral(propertyName)
      ? propertyName.text
      : isNumericLiteral(propertyName)
        ? propertyName.text
        : null; // ignore computed names for this check
}

export function isObjectLiteralWithProperty(
  variable: VariableDeclaration,
  propertyName: string,
) {
  const initializer = variable.initializer;
  if (!initializer) {
    return false;
  }

  if (!isObjectLiteral(initializer)) {
    return false;
  }

  return initializer.properties.some(
    (prop) => nameOfProperty(prop.name) === propertyName,
  );
}
