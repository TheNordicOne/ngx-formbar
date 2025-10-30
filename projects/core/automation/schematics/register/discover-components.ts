import {
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { RegisterContext } from './schema';
import {
  ClassDeclaration,
  createSourceFile,
  Decorator,
  getDecorators,
  isCallExpression,
  isClassDeclaration,
  isIdentifier,
  ScriptTarget,
  SourceFile,
} from 'typescript';
import { JsonObject } from '@angular-devkit/core';
import { dasherize } from '@angular-devkit/core/src/utils/strings';
import { FormbarComponentInfo } from './component-info.type';

const alwaysExclude = ['**/node_modules/**', '**/*.spec.ts'];
const defaultIncludes = ['**/*.ts'];

export function discoverComponents(
  tree: Tree,
  registerContext: RegisterContext,
  context: SchematicContext,
) {
  const { exclude = [], include = [...defaultIncludes] } = registerContext;
  const resolvedExcludes = [...exclude, ...alwaysExclude];

  const files = findPotentialControlComponents(tree, include, resolvedExcludes);
  registerContext.components = toComponentInfo(tree, files, context);

  context.logger.info(
    `${registerContext.components.length.toString()} components discovered`,
  );

  return registerContext;
}

function toComponentInfo(
  tree: Tree,
  files: string[],
  context: SchematicContext,
) {
  const components: FormbarComponentInfo[] = [];

  for (const filePath of files) {
    try {
      const buffer = tree.read(filePath);
      if (!buffer) {
        continue;
      }

      const fileContent = buffer.toString('utf-8');

      // Fast prefilter: only parse likely candidates
      if (!fileContent.includes('@Component')) {
        continue;
      }

      const hasNgxFbHints =
        fileContent.includes('hostDirectives') ||
        fileContent.toLowerCase().includes('ngxfb');

      if (!hasNgxFbHints) {
        continue;
      }

      const sourceFile = createSourceFile(
        filePath,
        fileContent,
        ScriptTarget.Latest,
        false,
      );

      const discoveredComponents = analyzeSourceFile(sourceFile, filePath);
      if (discoveredComponents.length > 0) {
        components.push(...discoveredComponents);
      }
    } catch (error) {
      context.logger.error(
        `Error processing file ${filePath}:`,
        error as JsonObject,
      );
    }
  }

  return components;
}

/**
 * Find files whose paths match any of the *glob* include patterns
 * and none of the *glob* exclude patterns.
 *
 * Supported glob features:
 *   - **  : recursive across path segments
 *   - *   : any sequence within a single path segment (excludes '/')
 *   - ?   : any single char within a segment (excludes '/')
 *   - []  : character class / ranges (e.g., [a-zA-Z0-9_])
 *
 * Notes:
 *   - Matching is done against the full POSIX-like path from Tree (e.g., "/src/app/a.ts").
 *   - Patterns are compiled once to RegExp for speed.
 *   - No extra dependencies.
 */
export function findPotentialControlComponents(
  tree: Tree,
  include: readonly string[],
  exclude: readonly string[] = [],
) {
  if (include.length === 0) {
    return [];
  }

  const includeRegs = compileGlobs(include, 'include');
  const excludeRegs = compileGlobs(exclude, 'exclude');

  const out = new Set<string>();

  const quickReject = (p: string) => {
    if (p.includes('/node_modules/')) {
      return true;
    }
    return p.endsWith('.spec.ts');
  };

  tree.getDir('/').visit((path) => {
    if (quickReject(path)) {
      return;
    }

    if (excludeRegs.length > 0 && someRegMatch(excludeRegs, path)) {
      return;
    }

    if (!someRegMatch(includeRegs, path)) {
      return;
    }

    out.add(path);
  });

  return Array.from(out).sort();
}

/** Compile glob patterns to anchored RegExp. */
function compileGlobs(
  patterns: readonly string[],
  kind: 'include' | 'exclude',
) {
  const regs: RegExp[] = [];

  if (patterns.length === 0) {
    return regs;
  }

  for (const raw of patterns) {
    if (!raw || raw.trim() === '') {
      throw new SchematicsException(
        `Empty ${kind} glob pattern is not allowed.`,
      );
    }

    const rx = globToRegExp(raw);
    if (!rx) {
      throw new SchematicsException(`Invalid ${kind} glob "${raw}".`);
    }

    regs.push(rx);
  }

  return regs;
}

function someRegMatch(regs: readonly RegExp[], input: string) {
  if (regs.length === 0) {
    return false;
  }

  for (const r of regs) {
    if (r.test(input)) {
      return true;
    }
  }

  return false;
}

/**
 * Convert a glob into a **path-aware** RegExp.
 * Rules:
 *   - '**'  -> '.*'  (may cross '/')
 *   - '*'   -> '[^/]*'
 *   - '?'   -> '[^/]'
 *   - '[]'  -> preserved (with minimal validation)
 *   - escape regex metachars elsewhere
 *   - anchored with ^...$ for full-path match
 */
function globToRegExp(glob: string) {
  if (!glob) {
    return undefined;
  }

  let rx = '^';
  let i = 0;

  while (i < glob.length) {
    const ch = glob[i];

    // Handle '**' specially (before '*').
    if (ch === '*' && i + 1 < glob.length && glob[i + 1] === '*') {
      while (i + 1 < glob.length && glob[i] === '*' && glob[i + 1] === '*') {
        i += 1;
      }
      rx += '.*';
      i += 2;
      continue;
    }

    switch (ch) {
      case '*': {
        rx += '[^/]*';
        i += 1;
        break;
      }
      case '?': {
        rx += '[^/]';
        i += 1;
        break;
      }
      case '[': {
        const end = glob.indexOf(']', i + 1);
        if (end === -1) {
          rx += '\\[';
          i += 1;
          break;
        }

        const cls = glob.slice(i, end + 1);
        if (cls.includes('/')) {
          rx += '\\[';
          i += 1;
          break;
        }

        rx += cls;
        i = end + 1;
        break;
      }
      case '\\':
      case '.':
      case '+':
      case '^':
      case '$':
      case '{':
      case '}':
      case '(':
      case ')':
      case '|': {
        rx += '\\' + ch;
        i += 1;
        break;
      }
      default: {
        rx += ch;
        i += 1;
        break;
      }
    }
  }

  rx += '$';

  try {
    return new RegExp(rx);
  } catch {
    return undefined;
  }
}

/**
 * Analyzes a TypeScript source file to find components with Ngx Formbar directives
 */
function analyzeSourceFile(sourceFile: SourceFile, filePath: string) {
  const components: FormbarComponentInfo[] = [];

  for (const stmt of sourceFile.statements) {
    if (!isClassDeclaration(stmt)) {
      continue;
    }

    const decorators = getDecorators(stmt);
    if (!decorators || decorators.length === 0) {
      continue;
    }

    const componentDecorator = decorators.find((decorator: Decorator) => {
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

/** Get a decorator's identifier name (e.g., 'Component') */
function getDecoratorName(decorator: Decorator) {
  if (!isCallExpression(decorator.expression)) {
    return undefined;
  }

  const callee = decorator.expression.expression;
  if (isIdentifier(callee)) {
    return callee.text;
  }

  return undefined;
}

/**
 * Extracts component information from a component declaration.
 */
function extractComponentInfo(
  classNode: ClassDeclaration,
  componentDecorator: Decorator,
  filePath: string,
): FormbarComponentInfo | undefined {
  if (!isCallExpression(componentDecorator.expression)) {
    return undefined;
  }

  const className = classNode.name?.text;

  if (!className) {
    return undefined;
  }

  const keyBase = stripComponentSuffix(className);
  const key = dasherize(keyBase);

  return {
    componentFilePath: filePath,
    componentClassName: className,
    key,
  };
}

function stripComponentSuffix(name: string): string {
  if (!name.endsWith('Component')) {
    return name;
  }

  return name.slice(0, name.length - 'Component'.length);
}
