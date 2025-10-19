import { SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  ObjectLiteralExpression,
  Project,
  QuoteKind,
  SourceFile,
  SyntaxKind,
  ts,
} from 'ts-morph';

export function setupTsMorphProject() {
  return new Project({
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
    },
  });
}

/** Load a TS file into an in‑memory ts-morph SourceFile */
export function getSourceFile(tree: Tree, filePath: string) {
  const buffer = tree.read(filePath);
  if (!buffer) {
    throw new SchematicsException(`Cannot find ${filePath}`);
  }
  const content = buffer.toString('utf-8');
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: { allowJs: true, target: 3 },
    skipFileDependencyResolution: true,
  });
  return project.createSourceFile(filePath, content, { overwrite: true });
}

/** Find the exported const componentRegistrations = { … } in a file */
export function findRegistrationsObject(
  source: SourceFile,
): ObjectLiteralExpression {
  const varDecl = source
    .getVariableDeclarations()
    .find(
      (d) => d.getName() === 'componentRegistrations' && d.hasExportKeyword(),
    );

  if (!varDecl) {
    throw new SchematicsException(
      `No exported 'componentRegistrations' found in ${source.getBaseName()}`,
    );
  }

  const init = varDecl.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
  if (!init) {
    throw new SchematicsException(
      `Expected 'componentRegistrations' to be initialized with an object literal in ${source.getBaseName()}`,
    );
  }

  return init;
}

/** Upsert a key→className into an ObjectLiteralExpression */
export function upsertObjectLiteral(
  objLit: ObjectLiteralExpression,
  key: string,
  className: string,
) {
  if (objLit.getProperty(key)) {
    return;
  }
  objLit.addPropertyAssignment({ name: key, initializer: className });
}

/**
 * Find a top-level variable by name whose initializer is an ObjectLiteralExpression,
 * accounting for wrappers like parentheses, type assertions, `satisfies`, and non-null.
 *
 * Pure: does not touch Tree/Recorder.
 */
export function findVariableWithObjectLiteral(
  sf: ts.SourceFile,
  expression: (d: ts.VariableDeclaration) => boolean,
): ts.ObjectLiteralExpression | null {
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) {
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
  expr: ts.Expression,
): ts.ObjectLiteralExpression | null {
  let current: ts.Expression | undefined = expr;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    if (ts.isObjectLiteralExpression(current)) {
      return current;
    }

    switch (current.kind) {
      case ts.SyntaxKind.ParenthesizedExpression:
        current = (current as ts.ParenthesizedExpression).expression;
        continue;
      case ts.SyntaxKind.AsExpression:
        current = (current as ts.AsExpression).expression;
        continue;
      case ts.SyntaxKind.SatisfiesExpression:
        current = (current as ts.SatisfiesExpression).expression;
        continue;
      case ts.SyntaxKind.NonNullExpression:
        current = (current as ts.NonNullExpression).expression;
        continue;
      case ts.SyntaxKind.CallExpression: {
        const call = current as ts.CallExpression;
        const callee = call.expression;
        if (
          ts.isParenthesizedExpression(callee) &&
          ts.isArrowFunction(callee.expression)
        ) {
          const body = callee.expression.body;
          if (
            ts.isParenthesizedExpression(body) &&
            ts.isObjectLiteralExpression(body.expression)
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

export function isObjectLiteral(
  node: ts.Node,
): node is ts.ObjectLiteralExpression {
  return ts.isObjectLiteralExpression(node);
}

export function nameOfProperty(propertyName: ts.PropertyName | undefined) {
  if (!propertyName) {
    return null;
  }
  return ts.isIdentifier(propertyName)
    ? propertyName.text
    : ts.isStringLiteral(propertyName)
      ? propertyName.text
      : ts.isNumericLiteral(propertyName)
        ? propertyName.text
        : null; // ignore computed names for this check
}

export function isObjectLiteralWithProperty(
  variable: ts.VariableDeclaration,
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

export function addArguments(
  call: ts.CallExpression,
  extra: readonly ts.Expression[],
) {
  return ts.factory.updateCallExpression(
    call,
    call.expression,
    call.typeArguments,
    [...call.arguments, ...extra],
  );
}

export function appendArrayElement(
  arr: ts.ArrayLiteralExpression,
  el: ts.Expression,
): ts.ArrayLiteralExpression {
  return ts.factory.updateArrayLiteralExpression(arr, [...arr.elements, el]);
}

export function addUniqueArrayElement(
  arr: ts.ArrayLiteralExpression,
  el: ts.Expression,
  same: (a: ts.Expression) => boolean,
): ts.ArrayLiteralExpression {
  const elements = [...arr.elements];
  const firstIdx = elements.findIndex(same);

  if (firstIdx === -1) {
    return ts.factory.updateArrayLiteralExpression(arr, [...elements, el]);
  }

  const filtered = elements.filter((e) => !same(e));
  filtered.splice(firstIdx, 0, el);
  return ts.factory.updateArrayLiteralExpression(arr, filtered);
}
