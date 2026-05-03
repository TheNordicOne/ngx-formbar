import {
  isClassDeclaration,
  isExpressionWithTypeArguments,
  isIdentifier,
  isInterfaceDeclaration,
  isLiteralTypeNode,
  isPropertySignature,
  Node,
  SourceFile,
  StringLiteral,
  SyntaxKind,
} from 'typescript';

export function classImplementsInterface(
  sf: SourceFile,
  className: string,
  interfaceName: string,
) {
  let found = false;

  const visit = (node: Node): void => {
    if (found) {
      return;
    }

    if (
      isClassDeclaration(node) &&
      node.name?.text === className &&
      node.heritageClauses
    ) {
      const implementsClause = node.heritageClauses.find(
        (clause) => clause.token === SyntaxKind.ImplementsKeyword,
      );

      if (!implementsClause) {
        return;
      }

      found = implementsClause.types.some((typeNode) => {
        if (!isExpressionWithTypeArguments(typeNode)) {
          return false;
        }
        const expr = typeNode.expression;
        return isIdentifier(expr) && expr.text === interfaceName;
      });
      return;
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function classDeclarationExists(sf: SourceFile, className: string) {
  let found = false;

  const visit = (node: Node): void => {
    if (found) {
      return;
    }

    if (isClassDeclaration(node) && node.name) {
      found = node.name.text === className;
      return;
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function interfaceHasTypeLiteral(
  sf: SourceFile,
  interfaceName: string,
  typeLiteral: string,
) {
  let ok = false;

  const visit = (node: Node): void => {
    if (ok) {
      return;
    }

    if (isInterfaceDeclaration(node)) {
      if (node.name.text !== interfaceName) {
        node.forEachChild(visit);
        return;
      }

      const typeMember = node.members.find((m) => {
        if (!isPropertySignature(m)) {
          return false;
        }
        const n = m.name;
        return isIdentifier(n) && n.text === 'type';
      });

      if (!typeMember || !isPropertySignature(typeMember)) {
        return;
      }

      const t = typeMember.type;
      if (!t || !isLiteralTypeNode(t)) {
        return;
      }

      const lit = t.literal as StringLiteral | undefined;
      if (!lit) {
        return;
      }

      ok = lit.text === typeLiteral;
      return;
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return ok;
}

