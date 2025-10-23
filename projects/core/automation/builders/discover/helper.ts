import {
  CallExpression,
  ImportDeclaration,
  ObjectLiteralExpression,
  PropertyAssignment,
  SourceFile,
  SyntaxKind,
} from 'ts-morph';

import {
  NgxFormworkAutomationConfig,
  RegistrationType,
} from '../../shared/shared-config.type';
import { SchematicsException } from '@angular-devkit/schematics';
import {
  DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  DEFAULT_SCHEMATICS_CONFIG_PATH,
} from '../../shared/constants';
import * as path from 'path';
import * as fs from 'fs';
import { BuilderContext } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

function findAutomationConfig(workspaceRoot: string): string | null {
  const configPath = path.join(
    workspaceRoot,
    DEFAULT_SCHEMATICS_CONFIG_PATH,
    DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  );
  if (fs.existsSync(configPath)) {
    return configPath;
  }

  const rootConfigPath = path.join(
    workspaceRoot,
    DEFAULT_SCHEMATIC_CONFIG_FILE_NAME,
  );
  if (fs.existsSync(rootConfigPath)) {
    return rootConfigPath;
  }

  return searchInDirectory(workspaceRoot);
}

function searchInDirectory(dir: string): string | null {
  const configFile = path.join(dir, DEFAULT_SCHEMATIC_CONFIG_FILE_NAME);
  if (fs.existsSync(configFile)) {
    return configFile;
  }

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const subdirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(dir, entry.name));

    for (const subdir of subdirs) {
      const foundInSubdir = searchInDirectory(subdir);
      if (foundInSubdir) {
        return foundInSubdir;
      }
    }
  } catch (error) {
    console.warn(`Error searching directory ${dir}:`, error);
  }

  return null;
}

export function readAutomationConfig(
  configPathOrRoot: string,
  context: BuilderContext,
): NgxFormworkAutomationConfig | null {
  try {
    if (
      fs.existsSync(configPathOrRoot) &&
      fs.lstatSync(configPathOrRoot).isDirectory()
    ) {
      const foundPath = findAutomationConfig(configPathOrRoot);
      if (!foundPath) {
        return null;
      }
      configPathOrRoot = foundPath;
    }

    if (fs.existsSync(configPathOrRoot)) {
      const content = fs.readFileSync(configPathOrRoot, 'utf8');
      return JSON.parse(content) as NgxFormworkAutomationConfig;
    }
  } catch (error) {
    context.logger.warn(
      `Failed to read automation config from ${configPathOrRoot}:`,
      error as JsonObject,
    );
  }

  return null;
}

/**
 * Register a component in the configuration file, based on the specified registration type.
 *
 * @param sourceFile The source file to modify
 * @param options The registration options
 * @returns The modified source file (and any additional files)
 */
export function register(
  sourceFile: SourceFile,
  options: RegistrationOptions,
): RegistrationResult {
  switch (options.registrationType) {
    case 'token':
      return registerAsToken(sourceFile, options);
    case 'map':
    default:
      return registerAsConfig(sourceFile, options);
  }
}

/**
 * Register a component in a config-based pattern (defineFormworkConfig or provideFormwork)
 */
export function registerAsConfig(
  configFile: SourceFile,
  options: RegistrationOptions,
): RegistrationResult {
  const { key, componentClassName, componentImportPath } = options;
  const camelKey = camelize(key);

  // 1) Ensure import of the component class
  ensureImport(configFile, componentClassName, componentImportPath);

  // 2) Check for external registrations import
  const regImport = configFile
    .getImportDeclarations()
    .find((dec) =>
      dec
        .getNamedImports()
        .some((ni) => ni.getName() === 'componentRegistrations'),
    );

  if (regImport) {
    // External registrations pattern - need to modify that file
    const externalFile = resolveExternalRegistrationsFile(
      configFile,
      regImport,
    );
    if (externalFile) {
      const relPath = buildRelativePath(
        externalFile.getFilePath(),
        componentImportPath,
        configFile.getFilePath(),
      );

      // 1) Ensure import of the new component in external file
      ensureImport(externalFile, componentClassName, relPath);

      // 2) Upsert registration inside componentRegistrations
      const regObj = findRegistrationsObject(externalFile);
      upsertObjectLiteral(regObj, camelKey, componentClassName);

      return {
        configFile,
        additionalFiles: [externalFile],
      };
    }
  }

  // 3) Try inline: defineFormworkConfig({...})
  const defineCall = configFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .find((c) => c.getExpression().getText() === 'defineFormworkConfig');
  const defineArg = defineCall?.getArguments()[0];
  if (ObjectLiteralExpression.isObjectLiteralExpression(defineArg)) {
    upsertIntoComponentRegistrations(defineArg, camelKey, componentClassName);
    return { configFile };
  }

  // 4) Try inline: provideFormwork({ … }) inside providers
  const provArg = configFile
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
    upsertIntoComponentRegistrations(provArg, camelKey, componentClassName);
    return { configFile };
  }

  // No suitable pattern found - return unmodified
  console.warn(
    `Neither external registrations nor a defineFormworkConfig/provideFormwork(...) call was found in ${configFile.getFilePath()}.`,
  );
  return { configFile };
}

/**
 * Register a component using injection token pattern
 */
export function registerAsToken(
  providerFile: SourceFile,
  options: RegistrationOptions,
): RegistrationResult {
  const {
    key,
    componentClassName,
    componentImportPath,
    tokenName = 'NGX_FW_COMPONENT_REGISTRATIONS',
    tokenImportPath = 'ngx-formwork',
  } = options;

  // 1) Ensure token import
  ensureImport(providerFile, tokenName, tokenImportPath);

  // 2) Ensure component import
  ensureImport(providerFile, componentClassName, componentImportPath);

  // 3) Find the provider variable (componentRegistrationsProvider)
  const providerVar = providerFile
    .getVariableDeclarations()
    .find(
      (v) =>
        v.getName() === 'componentRegistrationsProvider' &&
        v.hasExportKeyword(),
    );

  if (!providerVar) {
    console.warn(
      `No exported 'componentRegistrationsProvider' variable found in ${providerFile.getFilePath()}.`,
    );
    return { configFile: providerFile };
  }

  // 4) Find the Map initialization
  const initializer = providerVar.getInitializer();
  if (
    !initializer ||
    !ObjectLiteralExpression.isObjectLiteralExpression(initializer)
  ) {
    console.warn(
      `Expected 'componentRegistrationsProvider' to be initialized with an object literal.`,
    );
    return { configFile: providerFile };
  }

  // 5) Find the useValue property
  const useValueProp = initializer.getProperty('useValue') as
    | PropertyAssignment
    | undefined;
  if (!useValueProp) {
    console.warn(
      `No 'useValue' property found in componentRegistrationsProvider.`,
    );
    return { configFile: providerFile };
  }

  // 6) Find the Map constructor call
  const mapCall = useValueProp
    .getDescendantsOfKind(SyntaxKind.NewExpression)
    .find((expr) => expr.getExpression().getText() === 'Map');

  if (!mapCall) {
    console.warn(`No 'new Map(...)' found in useValue.`);
    return { configFile: providerFile };
  }

  // 7) Get the array literal with entries
  const arrayArg = mapCall.getArguments().at(0);
  if (!arrayArg || arrayArg.getKind() !== SyntaxKind.ArrayLiteralExpression) {
    console.warn(`Map constructor doesn't have an array literal argument.`);
    return { configFile: providerFile };
  }

  const arrayLiteral = arrayArg.asKindOrThrow(
    SyntaxKind.ArrayLiteralExpression,
  );

  // 8) Check if entry already exists
  const entries = arrayLiteral.getElements();
  const keyLiteral = `'${key}'`;
  const alreadyExists = entries.some((entry) => {
    if (entry.getKind() === SyntaxKind.ArrayLiteralExpression) {
      const tupleElements = entry
        .asKind(SyntaxKind.ArrayLiteralExpression)
        ?.getElements();
      return tupleElements?.[0]?.getText() === keyLiteral;
    }
    return false;
  });

  if (!alreadyExists) {
    // Add new entry
    arrayLiteral.addElement(`['${key}', ${componentClassName}]`);
  }

  return { configFile: providerFile };
}

// Helper methods

export function ensureImport(
  sourceFile: SourceFile,
  namedImport: string,
  moduleSpecifier: string,
): void {
  const existingImport = sourceFile.getImportDeclaration(
    (dec) => dec.getModuleSpecifierValue() === moduleSpecifier,
  );

  if (existingImport) {
    if (
      !existingImport
        .getNamedImports()
        .some((ni) => ni.getName() === namedImport)
    ) {
      existingImport.addNamedImport(namedImport);
    }
  } else {
    sourceFile.addImportDeclaration({
      namedImports: [namedImport],
      moduleSpecifier,
    });
  }
}

export function resolveExternalRegistrationsFile(
  configFile: SourceFile,
  importDecl: ImportDeclaration,
): SourceFile | null {
  const rawModule = importDecl.getModuleSpecifierValue();
  if (!rawModule.startsWith('.')) {
    // Not a relative import, can't resolve
    return null;
  }

  // Try to resolve from the project
  const project = configFile.getProject();
  const configDir = configFile.getDirectoryPath();

  // Build possible paths
  const possiblePaths = [
    `${configDir}/${rawModule}.ts`,
    `${configDir}/${rawModule}`,
  ];

  for (const p of possiblePaths) {
    const resolved = project.getSourceFile(p);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

/** Ensure there's a nested componentRegistrations property, then upsert */
export function upsertIntoComponentRegistrations(
  obj: ObjectLiteralExpression,
  key: string,
  className: string,
): void {
  const prop = obj.getProperty('componentRegistrations') as
    | PropertyAssignment
    | undefined;

  if (!prop) {
    obj.addPropertyAssignment({
      name: 'componentRegistrations',
      initializer: `{ ${key}: ${className} }`,
    });
    return;
  }

  const nested = prop.getInitializerIfKind(SyntaxKind.ObjectLiteralExpression);
  if (!nested) {
    console.warn('componentRegistrations is not an object literal');
    return;
  }

  if (!nested.getProperty(key)) {
    nested.addPropertyAssignment({ name: key, initializer: className });
  }
}

export function camelize(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

export function buildRelativePath(
  from: string,
  to: string,
  baseDir: string,
): string {
  // Handle absolute paths or non-relative import paths
  if (!to.startsWith('.')) {
    return to;
  }

  // Extract directories
  const fromDir = path.dirname(from);
  const basePathDir = path.dirname(baseDir);

  // Calculate relative path from the external file to where the component would be
  // if imported from the config file
  const absoluteTo = path.resolve(basePathDir, to);

  // Get relative path from the external registration file to the component
  let relativePath = path.relative(fromDir, absoluteTo);

  // Ensure it starts with ./ or ../
  if (!relativePath.startsWith('.')) {
    relativePath = `./${relativePath}`;
  }

  // Convert to posix style for consistency
  return relativePath.replace(/\\/g, '/');
}

/**
 * Result of a registration operation containing all modified source files
 */
export interface RegistrationResult {
  /** The main config/provider file that was modified */
  configFile: SourceFile;
  /** Any additional files that were modified (e.g., external registration files) */
  additionalFiles?: SourceFile[];
}

/**
 * Options for registering a component
 */
export interface RegistrationOptions {
  /** The key to register the component under (e.g., 'textInput') */
  key: string;
  /** The component class name (e.g., 'TextInputComponent') */
  componentClassName: string;
  /** The import path to the component (relative to the config file) */
  componentImportPath: string;
  /** Registration type: 'config' or 'token' */
  registrationType?: RegistrationType;
  /** The token name to use (e.g., 'NGX_FW_COMPONENT_REGISTRATIONS') */
  tokenName?: string;
  /** The import path for the token */
  tokenImportPath?: string;
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
