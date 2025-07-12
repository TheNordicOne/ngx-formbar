import * as ts from 'typescript';
import { Tree } from '@angular-devkit/schematics';

export function insertImportAndObjectLiteral(
  sourceFile: ts.SourceFile,
  filePath: string,
  tree: Tree,
  identifier: string,
  importPath: string,
  objectName: string,
  propertyName: string,
  valueToInsert: string,
) {
  const recorder = tree.beginUpdate(filePath);
  const importStatement = `import { ${identifier} } from '${importPath}';\n`;
  recorder.insertLeft(0, importStatement);

  sourceFile.forEachChild((node) => {
    if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.length > 0 &&
      ts.isIdentifier(node.declarationList.declarations[0].name) &&
      node.declarationList.declarations[0].name.text === objectName
    ) {
      const init = node.declarationList.declarations[0].initializer;
      if (init && ts.isObjectLiteralExpression(init)) {
        const prop = init.properties.find(
          (p) =>
            ts.isPropertyAssignment(p) &&
            ts.isIdentifier(p.name) &&
            p.name.text === propertyName,
        ) as ts.PropertyAssignment | undefined;
        if (prop && ts.isArrayLiteralExpression(prop.initializer)) {
          const arr = prop.initializer;
          const last = arr.elements.hasTrailingComma
            ? arr.end - 1
            : arr.elements.end;
          recorder.insertLeft(last, `, ${valueToInsert}`);
        }
      }
    }
  });

  tree.commitUpdate(recorder);
}
