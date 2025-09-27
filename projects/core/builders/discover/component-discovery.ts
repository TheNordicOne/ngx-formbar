import * as fs from 'fs';
import * as glob from 'glob';
import ts from 'typescript';
import {
  FormworkComponentInfo,
  FormworkComponentType,
} from './models/component-info.model';

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

  // Get all TypeScript files matching the patterns
  const files = getFilesMatchingPatterns(
    basePath,
    includePatterns,
    excludePatterns,
  );

  // Analyze each file for Ngx Formwork directives
  files.forEach((filePath) => {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const sourceFile = ts.createSourceFile(
        filePath,
        fileContent,
        ts.ScriptTarget.Latest,
        true,
      );

      const discoveredComponents = analyzeSourceFile(sourceFile, filePath);
      components.push(...discoveredComponents);
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
    }
  });

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
  let allFiles: string[] = [];

  includePatterns.forEach((pattern) => {
    const files = glob.sync(pattern, {
      cwd: basePath,
      absolute: true,
      ignore: excludePatterns,
      fs: fs,
    });

    allFiles = [...allFiles, ...files];
  });

  // Remove duplicates
  return [...new Set(allFiles)];
}

/**
 * Analyzes a TypeScript source file to find components with Ngx Formwork directives
 */
function analyzeSourceFile(
  sourceFile: ts.SourceFile,
  filePath: string,
): FormworkComponentInfo[] {
  const components: FormworkComponentInfo[] = [];

  // Visit all nodes in the source file
  ts.forEachChild(sourceFile, (node) => {
    visitNode(node, filePath, components);
  });

  return components;
}

/**
 * Recursively visits nodes to find components with directives
 */
function visitNode(
  node: ts.Node,
  filePath: string,
  components: FormworkComponentInfo[],
): void {
  // Check if the node is a class declaration with a Component decorator
  if (ts.isClassDeclaration(node)) {
    const decorators = ts.getDecorators(node);
    if (decorators && decorators.length > 0) {
      const componentDecorator = decorators.find((decorator) => {
        // Check if it's the @Component decorator
        const decoratorName = getDecoratorName(decorator);
        return decoratorName === 'Component';
      });

      if (componentDecorator && node.name) {
        // Extract component information from decorator
        const componentInfo = extractComponentInfo(
          node,
          componentDecorator,
          filePath,
        );
        if (componentInfo) {
          components.push(componentInfo);
        }
      }
    }
  }

  // Continue visiting child nodes
  ts.forEachChild(node, (child) => {
    visitNode(child, filePath, components);
  });
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
    !ts.isObjectLiteralExpression(componentDecorator.expression.arguments[0])
  ) {
    return undefined;
  }

  const className = classNode.name.text;
  const componentArgs = componentDecorator.expression.arguments[0];

  // Get the selector
  let selector: string | undefined;
  // Find hostDirectives property
  let hostDirectivesNode: ts.PropertyAssignment | undefined;

  for (const prop of componentArgs.properties) {
    if (ts.isPropertyAssignment(prop)) {
      if (prop.name.getText() === 'selector') {
        if (ts.isStringLiteral(prop.initializer)) {
          selector = prop.initializer.text;
        }
      } else if (prop.name.getText() === 'hostDirectives') {
        hostDirectivesNode = prop;
      }
    }
  }

  // Added: handle identifier initializer (variable) directly here
  if (hostDirectivesNode && ts.isIdentifier(hostDirectivesNode.initializer)) {
    const variableName = hostDirectivesNode.initializer.text;
    if (variableName.includes('ngxfw')) {
      let type: FormworkComponentType | undefined;
      const lower = variableName.toLowerCase();
      if (lower.includes('block')) type = FormworkComponentType.Block;
      else if (lower.includes('group')) type = FormworkComponentType.Group;
      else if (lower.includes('control')) type = FormworkComponentType.Control;
      if (type) {
        return {
          type,
          filePath,
          className,
          // selector already resolved above
          selector,
          // Default assumption for variable-based host directive declaration
          directiveInputs: ['content', 'name'],
        };
      }
    }
  }

  // If no hostDirectives found, check for a variable assignment pattern
  if (!hostDirectivesNode) {
    return checkForHostDirectiveVariable(
      componentArgs,
      filePath,
      className,
      selector,
    );
  }

  // Process the hostDirectives property
  return processHostDirectives(
    hostDirectivesNode,
    filePath,
    className,
    selector,
  );
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
    if (
      ts.isPropertyAssignment(prop) &&
      prop.name.getText() === 'hostDirectives'
    ) {
      if (ts.isIdentifier(prop.initializer)) {
        const variableName = prop.initializer.text;
        // If it contains ngxfwBlock, ngxfwGroup, or ngxfwControl, it's likely a directive we're looking for
        if (variableName.includes('ngxfw')) {
          let type: FormworkComponentType | undefined;
          if (variableName.toLowerCase().includes('block')) {
            type = FormworkComponentType.Block;
          } else if (variableName.toLowerCase().includes('group')) {
            type = FormworkComponentType.Group;
          } else if (variableName.toLowerCase().includes('control')) {
            type = FormworkComponentType.Control;
          }

          if (type) {
            return {
              type,
              filePath,
              className,
              selector,
              directiveInputs: ['content', 'name'], // Assuming default inputs based on the example
            };
          }
        }
      }
    }
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

  // Handle identifier variable again (in case future refactors call directly)
  if (ts.isIdentifier(hostDirectivesNode.initializer)) {
    const variableName = hostDirectivesNode.initializer.text;
    if (variableName.includes('ngxfw')) {
      const lower = variableName.toLowerCase();
      if (lower.includes('block')) type = FormworkComponentType.Block;
      else if (lower.includes('group')) type = FormworkComponentType.Group;
      else if (lower.includes('control')) type = FormworkComponentType.Control;
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

  // Handle array of host directives
  if (ts.isArrayLiteralExpression(hostDirectivesNode.initializer)) {
    for (const element of hostDirectivesNode.initializer.elements) {
      const result = extractDirectiveInfo(element);
      if (result) {
        type = result.type;
        directiveInputs.push(...result.inputs);
        break; // Found a matching directive
      }
    }
    // Handle single host directive object
  } else if (ts.isObjectLiteralExpression(hostDirectivesNode.initializer)) {
    const result = extractDirectiveInfo(hostDirectivesNode.initializer);
    if (result) {
      type = result.type;
      directiveInputs.push(...result.inputs);
    }
  }

  if (type) {
    return {
      type,
      filePath,
      className,
      selector,
      directiveInputs,
    };
  }

  return undefined;
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
    if (ts.isPropertyAssignment(prop)) {
      if (prop.name.getText() === 'directive') {
        if (ts.isIdentifier(prop.initializer)) {
          directiveName = prop.initializer.text;
        } else if (ts.isPropertyAccessExpression(prop.initializer)) {
          directiveName = prop.initializer.name.text;
        }
      } else if (prop.name.getText() === 'inputs') {
        if (ts.isArrayLiteralExpression(prop.initializer)) {
          inputs = prop.initializer.elements
            .filter(ts.isStringLiteral)
            .map((element) => element.text);
        }
      }
    }
  }

  if (!directiveName) {
    return undefined;
  }

  // Determine the type based on directive name
  if (directiveName.includes('NgxfwBlockDirective')) {
    return { type: FormworkComponentType.Block, inputs };
  } else if (directiveName.includes('NgxfwGroupDirective')) {
    return { type: FormworkComponentType.Group, inputs };
  } else if (directiveName.includes('NgxfwControlDirective')) {
    return { type: FormworkComponentType.Control, inputs };
  }

  return undefined;
}
