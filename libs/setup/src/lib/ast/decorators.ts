import {
  ArrayLiteralExpression,
  Expression,
  isArrayLiteralExpression,
  isCallExpression,
  isIdentifier,
  isObjectLiteralExpression,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isStringLiteral,
  Node,
  ObjectLiteralExpression,
  SourceFile,
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

export function getDecoratorObject(
  sf: SourceFile,
  decoratorName: string,
): ObjectLiteralExpression | undefined {
  let found: ObjectLiteralExpression | undefined;

  const visit = (node: Node): void => {
    if (found) {
      return;
    }

    if (
      isCallExpression(node) &&
      isCallee(node.expression, decoratorName) &&
      node.arguments.length > 0
    ) {
      const [firstArg] = node.arguments;
      if (isObjectLiteralExpression(firstArg)) {
        found = firstArg;
        return;
      }
    }

    node.forEachChild(visit);
  };

  sf.forEachChild(visit);
  return found;
}

export function decoratorPropInitializerIsIdentifier(
  sf: SourceFile,
  decoratorName: string,
  propName: string,
  identifierName: string,
): boolean {
  const obj = getDecoratorObject(sf, decoratorName);
  if (!obj) {
    return false;
  }

  const prop = obj.properties.find((p) => {
    if (!isPropertyAssignment(p)) {
      return false;
    }
    const n = p.name;
    return (
      (isIdentifier(n) && n.text === propName) ||
      (isStringLiteral(n) && n.text === propName)
    );
  });

  if (!prop || !isPropertyAssignment(prop)) {
    return false;
  }
  return (
    isIdentifier(prop.initializer) && prop.initializer.text === identifierName
  );
}

export function getDecoratorArrayProp(
  sf: SourceFile,
  decoratorName: string,
  propName: string,
): ArrayLiteralExpression | undefined {
  const obj = getDecoratorObject(sf, decoratorName);
  if (!obj) {
    return undefined;
  }

  const prop = obj.properties.find((p) => {
    if (!isPropertyAssignment(p)) {
      return false;
    }
    const n = p.name;
    return (
      (isIdentifier(n) && n.text === propName) ||
      (isStringLiteral(n) && n.text === propName)
    );
  });

  if (!prop || !isPropertyAssignment(prop)) {
    return undefined;
  }

  return isArrayLiteralExpression(prop.initializer)
    ? prop.initializer
    : undefined;
}

export function decoratorArrayPropContainsIdentifier(
  sf: SourceFile,
  decoratorName: string,
  propName: string,
  identifierName: string,
): boolean {
  const arr = getDecoratorArrayProp(sf, decoratorName, propName);
  if (!arr) {
    return false;
  }

  return arr.elements.some((el) => {
    if (!isIdentifier(el)) {
      return false;
    }

    return el.text === identifierName;
  });
}

export function decoratorArrayPropContainsProviderObject(
  sf: SourceFile,
  decoratorName: string,
  propName: string,
  tokenName: string,
): boolean {
  const arr = getDecoratorArrayProp(sf, decoratorName, propName);
  if (!arr) {
    return false;
  }

  return arr.elements.some((el) => {
    if (!isObjectLiteralExpression(el)) {
      return false;
    }

    const provideProp = el.properties.find((p) => {
      if (!isPropertyAssignment(p)) {
        return false;
      }
      const n = p.name;
      const isProvide =
        (isIdentifier(n) && n.text === 'provide') ||
        (isStringLiteral(n) && n.text === 'provide');
      if (!isProvide) {
        return false;
      }
      return isIdentifier(p.initializer) && p.initializer.text === tokenName;
    });

    return !!provideProp;
  });
}

export function decoratorHasProp(
  sf: SourceFile,
  decoratorName: string,
  propName: string,
): boolean {
  const obj = getDecoratorObject(sf, decoratorName);
  if (!obj) {
    return false;
  }

  return obj.properties.some((p) => {
    if (!isPropertyAssignment(p)) {
      return false;
    }
    const n = p.name;
    return (
      (isIdentifier(n) && n.text === propName) ||
      (isStringLiteral(n) && n.text === propName)
    );
  });
}

export function decoratorHostDirectivesHasInlineDirectiveWithInputs(
  sf: SourceFile,
  directiveIdentifier = 'NgxfbControlDirective',
  expectedInputs: string[] = ['content', 'name'],
): boolean {
  const arr = getDecoratorArrayProp(sf, 'Component', 'hostDirectives');
  if (!arr) {
    return false;
  }

  return arr.elements.some((el) => {
    if (!isObjectLiteralExpression(el)) {
      return false;
    }

    const directiveProp = el.properties.find((p) => {
      if (!isPropertyAssignment(p)) {
        return false;
      }
      const n = p.name;
      const isDirectiveKey =
        (isIdentifier(n) && n.text === 'directive') ||
        (isStringLiteral(n) && n.text === 'directive');
      if (!isDirectiveKey) {
        return false;
      }
      return (
        isIdentifier(p.initializer) &&
        p.initializer.text === directiveIdentifier
      );
    });

    if (!directiveProp) {
      return false;
    }

    const inputsProp = el.properties.find((p) => {
      if (!isPropertyAssignment(p)) {
        return false;
      }
      const n = p.name;
      const isInputsKey =
        (isIdentifier(n) && n.text === 'inputs') ||
        (isStringLiteral(n) && n.text === 'inputs');
      if (!isInputsKey) {
        return false;
      }
      const init = p.initializer;
      if (!isArrayLiteralExpression(init)) {
        return false;
      }
      const values = init.elements.filter(isStringLiteral).map((s) => s.text);
      return expectedInputs.every((i) => values.includes(i));
    });

    return !!inputsProp;
  });
}

export function componentSelectorEquals(
  sf: SourceFile,
  expected: string,
): boolean {
  const obj = getDecoratorObject(sf, 'Component');
  if (!obj) {
    return false;
  }

  const prop = obj.properties.find((p) => {
    if (!isPropertyAssignment(p)) {
      return false;
    }
    const n = p.name;
    return (
      (isIdentifier(n) && n.text === 'selector') ||
      (isStringLiteral(n) && n.text === 'selector')
    );
  });

  if (!prop || !isPropertyAssignment(prop)) {
    return false;
  }

  const init = prop.initializer;
  if (!isStringLiteral(init)) {
    return false;
  }

  return init.text === expected;
}
