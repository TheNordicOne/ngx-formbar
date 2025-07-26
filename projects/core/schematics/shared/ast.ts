import * as path from 'path';
import { SchematicsException, Tree } from '@angular-devkit/schematics';
import { buildRelativePath } from '@schematics/angular/utility/find-module';
import { strings } from '@angular-devkit/core';
import { findConfigPath } from './file';
import {
  CallExpression,
  ImportDeclaration,
  ObjectLiteralExpression,
  Project,
  PropertyAssignment,
  SourceFile,
  SyntaxKind,
} from 'ts-morph';

/** Load a TS file into an in‑memory ts-morph SourceFile */
function getSourceFile(tree: Tree, filePath: string): SourceFile {
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
function findRegistrationsObject(source: SourceFile): ObjectLiteralExpression {
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
function upsertObjectLiteral(
  objLit: ObjectLiteralExpression,
  key: string,
  className: string,
) {
  if (objLit.getProperty(key)) {
    return; // already exists
  }
  objLit.addPropertyAssignment({ name: key, initializer: className });
}

/** Ensure there's a nested componentRegistrations property, then upsert */
function upsertIntoComponentRegistrations(
  obj: ObjectLiteralExpression,
  key: string,
  className: string,
) {
  const prop = obj.getProperty('componentRegistrations') as PropertyAssignment;

  const nested = prop.getInitializerIfKindOrThrow(
    SyntaxKind.ObjectLiteralExpression,
  );

  if (!nested.getProperty(key)) {
    nested.addPropertyAssignment({ name: key, initializer: className });
  }
}

/** Resolve and update the external registrations file */
function updateExternalRegistrations(
  tree: Tree,
  configPath: string,
  importDecl: ImportDeclaration,
  key: string,
  className: string,
  componentFilePath: string,
): void {
  // Resolve the path to the external registrations file
  const rawModule = importDecl.getModuleSpecifierValue();
  const extPath = rawModule.startsWith('.')
    ? path.join(path.dirname(configPath), rawModule) +
      (path.extname(rawModule) ? '' : '.ts')
    : rawModule;

  const regSource = getSourceFile(tree, extPath);

  // 1) Ensure import of the new component in external file
  const relPath = buildRelativePath(extPath, componentFilePath);
  const compImport = regSource.getImportDeclaration(
    (dec) => dec.getModuleSpecifierValue() === relPath,
  );
  if (compImport) {
    if (
      !compImport.getNamedImports().some((ni) => ni.getName() === className)
    ) {
      compImport.addNamedImport(className);
    }
  } else {
    regSource.addImportDeclaration({
      namedImports: [className],
      moduleSpecifier: relPath,
    });
  }

  // 2) Upsert registration inside componentRegistrations
  const regObj = findRegistrationsObject(regSource);
  upsertObjectLiteral(regObj, strings.camelize(key), className);

  // 3) Persist changes
  regSource.formatText({ indentSize: 2, convertTabsToSpaces: true });
  tree.overwrite(extPath, regSource.getFullText());
}

/**
 * Main schematic entry: registers a component in external or inline config.
 */
export function registerComponentInConfig(
  tree: Tree,
  sourceRoot: string,
  key: string,
  componentFilePath: string,
  componentClassName: string,
): void {
  const configPath = findConfigPath(tree, sourceRoot);
  if (!configPath) {
    console.warn(
      `No config file found under "${sourceRoot}". Skipping registration.`,
    );
    return;
  }

  const sourceFile = getSourceFile(tree, configPath);
  const className = strings.classify(componentClassName);
  const importPath = buildRelativePath(configPath, componentFilePath);

  // 1) Ensure import of the component class
  const existingImport = sourceFile.getImportDeclaration(
    (dec) => dec.getModuleSpecifierValue() === importPath,
  );
  if (existingImport) {
    if (
      !existingImport.getNamedImports().some((ni) => ni.getName() === className)
    ) {
      existingImport.addNamedImport(className);
    }
  } else {
    sourceFile.addImportDeclaration({
      namedImports: [className],
      moduleSpecifier: importPath,
    });
  }

  // 2) If there's an import of componentRegistrations, update that file
  const regImport = sourceFile
    .getImportDeclarations()
    .find((dec) =>
      dec
        .getNamedImports()
        .some((ni) => ni.getName() === 'componentRegistrations'),
    );
  if (regImport) {
    updateExternalRegistrations(
      tree,
      configPath,
      regImport,
      key,
      className,
      componentFilePath,
    );
    return;
  }

  // 3) Inline: defineFormworkConfig({...})
  const defineCall = sourceFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((c) => c.getExpression().getText() === 'defineFormworkConfig');
  const defineArg = defineCall?.getArguments()[0];
  if (ObjectLiteralExpression.isObjectLiteralExpression(defineArg)) {
    upsertIntoComponentRegistrations(
      defineArg,
      strings.camelize(key),
      className,
    );
    sourceFile.formatText({ indentSize: 2, convertTabsToSpaces: true });
    tree.overwrite(configPath, sourceFile.getFullText());
    return;
  }

  // 4) Inline: provideFormwork({ … }) inside providers
  const provArg = sourceFile
    .getDescendantsOfKind(SyntaxKind.ArrayLiteralExpression)
    .filter(
      (arr) =>
        arr.getParentIfKind(SyntaxKind.PropertyAssignment)?.getName() ===
        'providers',
    )
    .reduce<CallExpression | undefined>((found, arr) => {
      if (found) return found;
      return arr
        .getElements()
        .find(
          (el) =>
            el.isKind(SyntaxKind.CallExpression) &&
            el.getExpression().getText() === 'provideFormwork',
        ) as CallExpression | undefined;
    }, undefined)
    ?.getArguments()[0] as ObjectLiteralExpression | undefined;
  if (provArg) {
    upsertIntoComponentRegistrations(provArg, strings.camelize(key), className);
    sourceFile.formatText({ indentSize: 2, convertTabsToSpaces: true });
    tree.overwrite(configPath, sourceFile.getFullText());
    return;
  }

  console.warn(
    `Neither external registrations nor a defineFormworkConfig/provideFormwork(...) call was found in ${configPath}.`,
  );
}
