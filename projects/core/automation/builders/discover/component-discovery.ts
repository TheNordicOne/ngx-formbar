import * as fs from 'fs';
import * as glob from 'glob';

import {
  FormworkComponentInfo,
  FormworkComponentType,
} from './models/component-info.model';
import { ts } from 'ts-morph';

/**
 * Find components that use Ngx Formwork directives based on the given patterns
 * @param basePath The base path to search from
 * @param includePatterns Glob patterns to include
 * @param excludePatterns Glob patterns to exclude
 * @returns Array of discovered component information
 */
export function findComponents(
  basePath: string,
  includePatterns: string[] = ['**/*.ts'],
  excludePatterns: string[] = ['**/node_modules/**', '**/*.spec.ts'],
): FormworkComponentInfo[] {
  const components: FormworkComponentInfo[] = [];

  const files = getFilesMatchingPatterns(
    basePath,
    includePatterns,
    excludePatterns,
  );

  for (const filePath of files) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Fast prefilter: skip parsing if no chance to contain a relevant component
      // We expect Angular components with hostDirectives or ngxfw tokens
      if (
        !fileContent.includes('@Component') ||
        !(
          fileContent.includes('hostDirectives') ||
          fileContent.toLowerCase().includes('ngxfw')
        )
      ) {
        continue;
      }

      const sourceFile = ts.createSourceFile(
        filePath,
        fileContent,
        ts.ScriptTarget.Latest,
        false,
      );

      const discoveredComponents = analyzeSourceFile(sourceFile, filePath);
      if (discoveredComponents.length) {
        components.push(...discoveredComponents);
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  }

  return components;
}

/**
 * Gets all files that match the include patterns and don't match the exclude patterns
 */
function getFilesMatchingPatterns(
  basePath: string,
  includePatterns: string[],
  excludePatterns: string[],
): string[] {
  const all = new Set<string>();

  for (const pattern of includePatterns) {
    const files = glob.sync(pattern, {
      cwd: basePath,
      absolute: true,
      ignore: excludePatterns,
      fs: fs,
      nodir: true,
    });

    for (const f of files) all.add(f);
  }

  return Array.from(all);
}

/**
 * Analyzes a TypeScript source file to find components with Ngx Formwork directives
 */
function analyzeSourceFile(
  sourceFile: ts.SourceFile,
  filePath: string,
): FormworkComponentInfo[] {
  const components: FormworkComponentInfo[] = [];

  // Only inspect top-level class declarations; avoid deep AST traversal
  for (const stmt of sourceFile.statements) {
    if (!ts.isClassDeclaration(stmt)) {
      continue;
    }

    const decorators = ts.getDecorators(stmt);
    if (!decorators || decorators.length === 0) {
      continue;
    }

    const componentDecorator = decorators.find((decorator: ts.Decorator) => {
      const decoratorName = getDecoratorName(decorator);
      return decoratorName === 'Component';
    });

    if (!componentDecorator || !stmt.name) {
      continue;
    }

    const componentInfo = extractComponentInfo(
      stmt,
      componentDecorator,
      filePath,
    );

    if (componentInfo) {
      components.push(componentInfo);
    }
  }

  return components;
}

/**
 * Gets the name of a decorator
 */
function getDecoratorName(decorator: ts.Decorator): string | undefined {
  if (!ts.isCallExpression(decorator.expression)) {
    return undefined;
  }

  const expression = decorator.expression.expression;
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  return undefined;
}

// Small helper to determine component type from a name token
function inferTypeFromToken(
  tokenLower: string,
): FormworkComponentType | undefined {
  if (tokenLower.includes('block')) {
    return FormworkComponentType.Block;
  }

  if (tokenLower.includes('group')) {
    return FormworkComponentType.Group;
  }

  if (tokenLower.includes('control')) {
    return FormworkComponentType.Control;
  }

  return undefined;
}

/**
 * Extracts component information from a component declaration
 */
function extractComponentInfo(
  classNode: ts.ClassDeclaration,
  componentDecorator: ts.Decorator,
  filePath: string,
): FormworkComponentInfo | undefined {
  if (
    !ts.isCallExpression(componentDecorator.expression) ||
    !classNode.name ||
    componentDecorator.expression.arguments.length === 0 ||
    !ts.isObjectLiteralExpression(componentDecorator.expression.arguments[0])
  ) {
    return undefined;
  }

  const className = classNode.name.text;
  const componentArgs = componentDecorator.expression.arguments[0];

  let selector: string | undefined;
  let hostDirectivesNode: ts.PropertyAssignment | undefined;

  for (const prop of componentArgs.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      continue;
    }

    const n = prop.name;
    const key =
      ts.isIdentifier(n) || ts.isStringLiteral(n) ? n.text : undefined;

    if (!key) {
      continue;
    }

    if (key === 'selector' && ts.isStringLiteral(prop.initializer)) {
      selector = prop.initializer.text;
    }

    if (key === 'hostDirectives') {
      hostDirectivesNode = prop;
    }
  }

  // If no hostDirectives found, check for a variable assignment pattern (fallback)
  if (!hostDirectivesNode) {
    return checkForHostDirectiveVariable(
      componentArgs,
      filePath,
      className,
      selector,
    );
  }

  if (!ts.isIdentifier(hostDirectivesNode.initializer)) {
    return processHostDirectives(
      hostDirectivesNode,
      filePath,
      className,
      selector,
    );
  }

  const variableNameLower = hostDirectivesNode.initializer.text.toLowerCase();

  if (!variableNameLower.includes('ngxfw')) {
    return;
  }

  const type = inferTypeFromToken(variableNameLower);

  if (!type) {
    return;
  }

  return {
    type,
    filePath,
    className,
    selector,
    directiveInputs: ['content', 'name'],
  };
}

/**
 * Checks for a hostDirective variable pattern like 'ngxfwControlHostDirective'
 */
function checkForHostDirectiveVariable(
  componentArgs: ts.ObjectLiteralExpression,
  filePath: string,
  className: string,
  selector?: string,
): FormworkComponentInfo | undefined {
  for (const prop of componentArgs.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      continue;
    }

    const name = prop.name;
    const isHostDirectives =
      (ts.isIdentifier(name) && name.text === 'hostDirectives') ||
      (ts.isStringLiteral(name) && name.text === 'hostDirectives');

    if (!isHostDirectives || !ts.isIdentifier(prop.initializer)) {
      continue;
    }

    const variableNameLower = prop.initializer.text.toLowerCase();
    if (!variableNameLower.includes('ngxfw')) {
      continue;
    }

    const type = inferTypeFromToken(variableNameLower);
    if (!type) {
      continue;
    }

    return {
      type,
      filePath,
      className,
      selector,
      directiveInputs: ['content', 'name'],
    };
  }

  return undefined;
}

/**
 * Processes hostDirectives property to find Ngx Formwork directives
 */
function processHostDirectives(
  hostDirectivesNode: ts.PropertyAssignment,
  filePath: string,
  className: string,
  selector?: string,
): FormworkComponentInfo | undefined {
  const directiveInputs: string[] = [];
  let type: FormworkComponentType | undefined;

  if (ts.isIdentifier(hostDirectivesNode.initializer)) {
    const variableNameLower = hostDirectivesNode.initializer.text.toLowerCase();
    if (variableNameLower.includes('ngxfw')) {
      type = inferTypeFromToken(variableNameLower);
      if (type) {
        return {
          type,
          filePath,
          className,
          selector,
          directiveInputs: ['content', 'name'],
        };
      }
    }
  }

  if (ts.isArrayLiteralExpression(hostDirectivesNode.initializer)) {
    for (const element of hostDirectivesNode.initializer.elements) {
      const result = extractDirectiveInfo(element);
      if (result) {
        type = result.type;
        directiveInputs.push(...result.inputs);
        break;
      }
    }
  } else if (ts.isObjectLiteralExpression(hostDirectivesNode.initializer)) {
    const result = extractDirectiveInfo(hostDirectivesNode.initializer);
    if (result) {
      type = result.type;
      directiveInputs.push(...result.inputs);
    }
  }

  if (!type) {
    return undefined;
  }

  return {
    type,
    filePath,
    className,
    selector,
    directiveInputs,
  };
}

/**
 * Extracts information about the directive from a node
 */
function extractDirectiveInfo(
  node: ts.Node,
): { type: FormworkComponentType; inputs: string[] } | undefined {
  if (!ts.isObjectLiteralExpression(node)) {
    return undefined;
  }

  let directiveName: string | undefined;
  let inputs: string[] = [];

  for (const prop of node.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      continue;
    }

    const name = prop.name;
    const keyText = ts.isIdentifier(name)
      ? name.text
      : ts.isStringLiteral(name)
        ? name.text
        : undefined;

    switch (keyText) {
      case 'directive': {
        if (ts.isIdentifier(prop.initializer)) {
          directiveName = prop.initializer.text;
          break;
        }

        if (ts.isPropertyAccessExpression(prop.initializer)) {
          directiveName = prop.initializer.name.text;
        }

        break;
      }
      case 'inputs': {
        if (!ts.isArrayLiteralExpression(prop.initializer)) {
          break;
        }
        inputs = prop.initializer.elements
          .filter(ts.isStringLiteral)
          .map((element: ts.StringLiteral) => element.text);
      }
    }
  }

  if (!directiveName) {
    return undefined;
  }

  if (directiveName.includes('NgxfwBlockDirective')) {
    return { type: FormworkComponentType.Block, inputs };
  }

  if (directiveName.includes('NgxfwGroupDirective')) {
    return { type: FormworkComponentType.Group, inputs };
  }

  if (directiveName.includes('NgxfwControlDirective')) {
    return { type: FormworkComponentType.Control, inputs };
  }

  return undefined;
}
