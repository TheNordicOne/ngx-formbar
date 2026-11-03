import {
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { RegisterContext } from './schema';
import {
  ClassDeclaration,
  Decorator,
  ExpressionWithTypeArguments,
  getDecorators,
  isCallExpression,
  isClassDeclaration,
  isIdentifier,
  isPropertyAccessExpression,
  SourceFile,
  SymbolFlags,
  SyntaxKind,
  TypeChecker,
} from 'typescript';
import { normalize, strings } from '@angular-devkit/core';
import { isWithin, resolveRequiredPath } from '@ngx-formbar/setup';
import { createTreeProgram } from '../schema/program';
import { FormbarComponentInfo } from './component-info.type';

const alwaysExclude = ['**/node_modules/**', '**/*.spec.ts'];
const defaultIncludes = ['**/*.ts'];
const contracts = [
  'ReactiveFormbarControl',
  'ReactiveFormbarGroup',
  'ReactiveFormbarArray',
  'FormbarBlock',
];

export function discoverComponents(
  tree: Tree,
  registerContext: RegisterContext,
  context: SchematicContext,
): RegisterContext {
  const { exclude = [], include = [...defaultIncludes] } = registerContext;
  const resolvedExcludes = [...exclude, ...alwaysExclude];

  const files = findPotentialControlComponents(
    tree,
    registerContext,
    include,
    resolvedExcludes,
  );
  registerContext.components = toComponentInfo(
    tree,
    files,
    registerContext.tsConfigPath,
    context,
  );

  context.logger.info(
    `${registerContext.components.length.toString()} components discovered in ${normalize(`/${registerContext.sourceRoot}`)}`,
  );

  return registerContext;
}

function toComponentInfo(
  tree: Tree,
  files: string[],
  tsConfigPath: string,
  context: SchematicContext,
) {
  const candidates = files.filter((filePath) => {
    const text = tree.read(filePath)?.toString('utf-8') ?? '';

    return text.includes('@Component') && text.includes('implements');
  });

  if (candidates.length === 0) {
    return [];
  }

  const { program, checker } = createTreeProgram(
    tree,
    tsConfigPath,
    candidates,
  );

  return candidates.flatMap((filePath) => {
    const sourceFile = program.getSourceFile(filePath);

    return sourceFile
      ? analyzeSourceFile(sourceFile, filePath, checker, context)
      : [];
  });
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
 *   - Patterns are paths as well, so "app/**" and "src/app/**" both match "/src/app/a.ts".
 *   - Patterns are compiled once to RegExp for speed.
 *   - No extra dependencies.
 */
export function findPotentialControlComponents(
  tree: Tree,
  {
    sourceRoot,
    otherProjectDirectories,
  }: Pick<RegisterContext, 'sourceRoot' | 'otherProjectDirectories'>,
  include: readonly string[],
  exclude: readonly string[] = [],
): string[] {
  if (include.length === 0) {
    return [];
  }

  const includeRegs = compileGlobs(include, 'include', sourceRoot);
  const excludeRegs = compileGlobs(exclude, 'exclude', sourceRoot);

  const out = new Set<string>();

  const quickReject = (p: string) =>
    p.includes('/node_modules/') ||
    p.endsWith('.spec.ts') ||
    otherProjectDirectories.some((directory) =>
      isWithin(p.slice(1), directory),
    );

  tree.getDir(normalize(`/${sourceRoot}`)).visit((path) => {
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
  sourceRoot: string,
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

    const resolved = resolveRequiredPath(kind, raw, sourceRoot);

    if (kind === 'include' && !canMatchWithin(resolved, sourceRoot)) {
      throw new SchematicsException(
        `"include" points outside the source root ${sourceRoot}: ${raw}`,
      );
    }

    const rx = globToRegExp(resolved);
    if (!rx) {
      throw new SchematicsException(`Invalid ${kind} glob "${raw}".`);
    }

    regs.push(rx);
  }

  return regs;
}

/** Whether the fixed folders a glob starts with lie in or above the source root. */
function canMatchWithin(glob: string, sourceRoot: string) {
  const segments = glob.slice(1).split('/');
  const firstPattern = segments.findIndex((segment) => /[*?[]/.test(segment));
  const fixed = segments
    .slice(0, firstPattern === -1 ? undefined : firstPattern)
    .join('/');

  return (
    isWithin(fixed, sourceRoot) ||
    isWithin(normalize(`/${sourceRoot}`).slice(1), fixed)
  );
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
 *   - a whole segment '**\/' may also match no segment at all
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
      const startsSegment = i === 0 || glob[i - 1] === '/';

      while (i + 1 < glob.length && glob[i] === '*' && glob[i + 1] === '*') {
        i += 1;
      }
      i += 1;

      if (startsSegment && glob[i] === '/') {
        rx += '(?:.*/)?';
        i += 1;
      } else {
        rx += '.*';
      }
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
function analyzeSourceFile(
  sourceFile: SourceFile,
  filePath: string,
  checker: TypeChecker,
  context: SchematicContext,
) {
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
      checker,
      context,
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
  checker: TypeChecker,
  context: SchematicContext,
): FormbarComponentInfo | undefined {
  if (!isCallExpression(componentDecorator.expression)) {
    return undefined;
  }

  const className = classNode.name?.text;
  const contract = contractOf(classNode, checker);

  if (!className || !contract) {
    return undefined;
  }

  const configured = configTypeLiteral(contract, checker);
  const key = configured ?? strings.dasherize(stripComponentSuffix(className));

  if (!configured) {
    context.logger.warn(
      `${className} has no single string \`type\` in its config, so it is registered as "${key}".`,
    );
  }

  return {
    componentFilePath: filePath,
    componentClassName: className,
    key,
  };
}

function contractOf(classNode: ClassDeclaration, checker: TypeChecker) {
  return classNode.heritageClauses
    ?.filter(({ token }) => token === SyntaxKind.ImplementsKeyword)
    .flatMap(({ types }) => [...types])
    .find((heritage) => isContract(heritage, checker));
}

/**
 * The imported name stands in when the package cannot be resolved, as then the
 * checker knows nothing about the symbol.
 */
function isContract(
  { expression }: ExpressionWithTypeArguments,
  checker: TypeChecker,
) {
  const symbol = checker.getSymbolAtLocation(expression);
  const original =
    symbol && symbol.flags & SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  const written = isPropertyAccessExpression(expression)
    ? expression.name.text
    : isIdentifier(expression)
      ? expression.text
      : undefined;

  return [original?.name, written].some(
    (name) => !!name && contracts.includes(name),
  );
}

/** The `type` of the config, which is the key a form refers to. */
function configTypeLiteral(
  contract: ExpressionWithTypeArguments,
  checker: TypeChecker,
) {
  const config = contract.typeArguments?.at(0);
  const property =
    config && checker.getTypeFromTypeNode(config).getProperty('type');
  const type = property && checker.getTypeOfSymbol(property);

  return type?.isStringLiteral() ? type.value : undefined;
}

function stripComponentSuffix(name: string): string {
  if (!name.endsWith('Component')) {
    return name;
  }

  return name.slice(0, name.length - 'Component'.length);
}
