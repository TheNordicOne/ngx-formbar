import {
  SchematicContext,
  SchematicsException,
  Tree,
} from '@angular-devkit/schematics';
import { RegisterContext } from './schema';
import {
  ClassDeclaration,
  ClassLikeDeclaration,
  Decorator,
  getCombinedModifierFlags,
  getDecorators,
  InterfaceDeclaration,
  isCallExpression,
  isClassDeclaration,
  isClassLike,
  isIdentifier,
  isImportDeclaration,
  isInterfaceDeclaration,
  isIntersectionTypeNode,
  isNamedImports,
  isTypeAliasDeclaration,
  isTypeReferenceNode,
  ModifierFlags,
  Node,
  NodeArray,
  SourceFile,
  Symbol as TsSymbol,
  SymbolFlags,
  Type,
  TypeAliasDeclaration,
  TypeChecker,
  TypeNode,
} from 'typescript';
import { normalize, strings } from '@angular-devkit/core';
import { isWithin, resolveRequiredPath } from '@ngx-formbar/setup';
import { createTreeProgram } from '../schema/program';
import { FormbarComponentInfo } from './component-info.type';

const defaultIncludes = ['**/*.ts'];
const globCharacters = /[*?[]/;
const CONTRACT = 'FormbarContract';
const utilityTypes = ['Partial', 'Readonly', 'Pick', 'Omit'];

export function discoverComponents(
  tree: Tree,
  registerContext: RegisterContext,
  context: SchematicContext,
): RegisterContext {
  const { exclude = [], include = [...defaultIncludes] } = registerContext;

  const files = findPotentialControlComponents(
    tree,
    registerContext,
    include,
    exclude,
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

    return text.includes('@Component');
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
 *   - A pattern without any of these can name a folder, so "app" also means "app/**".
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

    if (someRegMatch(excludeRegs, path)) {
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

    regs.push(rx, ...folderContents(resolved));
  }

  return regs;
}

/** A path without a glob character can name a folder, which stands for its contents. */
function folderContents(path: string) {
  const contents = isGlobFree(path) && globToRegExp(`${path}/**`);

  return contents ? [contents] : [];
}

function isGlobFree(path: string) {
  return !globCharacters.test(path);
}

/** Whether the fixed folders a glob starts with lie in or above the source root. */
function canMatchWithin(glob: string, sourceRoot: string) {
  const segments = glob.slice(1).split('/');
  const firstPattern = segments.findIndex((segment) => !isGlobFree(segment));
  const fixed = segments
    .slice(0, firstPattern === -1 ? undefined : firstPattern)
    .join('/');

  return (
    isWithin(fixed, sourceRoot) ||
    isWithin(normalize(`/${sourceRoot}`).slice(1), fixed)
  );
}

function someRegMatch(regs: readonly RegExp[], input: string) {
  return regs.some((r) => r.test(input));
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

  return isIdentifier(callee) ? callee.text : undefined;
}

/**
 * Extracts component information from a component declaration.
 */
function extractComponentInfo(
  classNode: ClassDeclaration,
  filePath: string,
  checker: TypeChecker,
  context: SchematicContext,
) {
  const className = classNode.name?.text;
  const configs = contractConfigs(classNode, new Map(), checker, new Set());

  if (!className || isAbstract(classNode)) {
    return undefined;
  }

  const namedExport = isNamedExport(classNode, className, checker);

  if (configs.length === 0) {
    warnAboutMentionedContract(
      classNode,
      className,
      namedExport,
      checker,
      context,
    );

    return undefined;
  }

  if (!namedExport) {
    context.logger.warn(
      `${className} is not a named export, so it is not registered.`,
    );

    return undefined;
  }

  const configured = configs
    .map((config) => configTypeLiteral(config, checker))
    .find(Boolean);
  const key =
    configured ?? strings.dasherize(className.replace(/Component$/, ''));

  return {
    componentFilePath: filePath,
    componentClassName: className,
    key,
    addedWarning: configured
      ? undefined
      : `${className} has no single string \`type\` in its config, so it is registered as "${key}".`,
  };
}

/**
 * Importing a contract suggests the class was meant to implement it, unless
 * another class in the file accounts for the import.
 */
function warnAboutMentionedContract(
  classNode: ClassDeclaration,
  className: string,
  namedExport: boolean,
  checker: TypeChecker,
  context: SchematicContext,
) {
  const sourceFile = classNode.getSourceFile();
  const contract = importedContract(sourceFile, checker);
  const accountedFor = sourceFile.statements
    .filter(isClassDeclaration)
    .some(
      (sibling) =>
        contractConfigs(sibling, new Map(), checker, new Set()).length > 0,
    );

  if (namedExport && contract && !accountedFor) {
    context.logger.warn(
      `${className} is not registered. Its file mentions ${contract}, but this schematic cannot read a contract from the class.`,
    );
  }
}

/** A class is left out, as importing a control does not mean implementing it. */
function importedContract(sourceFile: SourceFile, checker: TypeChecker) {
  return sourceFile.statements
    .filter(isImportDeclaration)
    .flatMap(({ importClause }) => {
      const bindings = importClause?.namedBindings;

      return bindings && isNamedImports(bindings) ? [...bindings.elements] : [];
    })
    .find(({ name }) => {
      const symbol = originalSymbol(name, checker);

      return (
        isContract(symbol) ||
        symbol?.declarations
          ?.filter(isTypeDeclaration)
          .some(
            (declaration) =>
              contractConfigs(declaration, new Map(), checker, new Set())
                .length > 0,
          )
      );
    })?.name.text;
}

function isTypeDeclaration(node: Node) {
  return isInterfaceDeclaration(node) || isTypeAliasDeclaration(node);
}

function isAbstract(classNode: ClassDeclaration) {
  return !!(getCombinedModifierFlags(classNode) & ModifierFlags.Abstract);
}

/** A registration imports the class by its name. */
function isNamedExport(
  classNode: ClassDeclaration,
  className: string,
  checker: TypeChecker,
) {
  const moduleSymbol = checker.getSymbolAtLocation(classNode.getSourceFile());

  return (
    !!moduleSymbol &&
    checker
      .getExportsOfModule(moduleSymbol)
      .some(({ name }) => name === className)
  );
}

/**
 * The config of each contract a declaration reaches, `undefined` for a contract
 * without one, and nothing at all when it reaches no contract.
 */
function contractConfigs(
  declaration: BuildingDeclaration,
  typeArguments: ReadonlyMap<Type, Type>,
  checker: TypeChecker,
  seen: Set<TsSymbol>,
): (Type | undefined)[] {
  return referencesOf(declaration).flatMap((written) => {
    const reference = withoutUtilityTypes(written, checker);
    const symbol = originalSymbol(reference.name, checker);

    if (isContract(symbol)) {
      const config = reference.typeArguments?.at(0);

      return [config && resolveType(config, typeArguments, checker)];
    }

    const unseen = symbolsBehind(reference.name, symbol, checker).filter(
      (behind) => !seen.has(behind),
    );
    const seenBelow = new Set([...seen, ...unseen]);

    return unseen
      .flatMap((behind) => behind.declarations ?? [])
      .filter(isBuildingDeclaration)
      .flatMap((inner) =>
        contractConfigs(
          inner,
          typeArgumentsOf(
            inner,
            reference.typeArguments,
            typeArguments,
            checker,
          ),
          checker,
          seenBelow,
        ),
      );
  });
}

type BuildingDeclaration =
  | ClassLikeDeclaration
  | InterfaceDeclaration
  | TypeAliasDeclaration;

function isBuildingDeclaration(node: Node): node is BuildingDeclaration {
  return (
    isClassLike(node) ||
    isInterfaceDeclaration(node) ||
    isTypeAliasDeclaration(node)
  );
}

/**
 * The types a declaration builds on. `implements` goes first, as it states the
 * config of this class, where `extends` passes on what a base states.
 */
function referencesOf(declaration: BuildingDeclaration) {
  if (isTypeAliasDeclaration(declaration)) {
    const { type } = declaration;

    return (isIntersectionTypeNode(type) ? [...type.types] : [type])
      .filter(isTypeReferenceNode)
      .map(({ typeName, typeArguments }) => ({
        name: typeName,
        typeArguments,
      }));
  }

  return [...(declaration.heritageClauses ?? [])]
    .reverse()
    .flatMap(({ types }) => [...types])
    .map(({ expression, typeArguments }) => ({
      name: expression,
      typeArguments,
    }));
}

interface TypeReference {
  name: Node;
  typeArguments?: NodeArray<TypeNode>;
}

/** `Omit<Contract<Config>, 'x'>` still states the config of the contract. */
function withoutUtilityTypes(
  reference: TypeReference,
  checker: TypeChecker,
): TypeReference {
  const wrapped = reference.typeArguments?.at(0);

  return wrapped &&
    isTypeReferenceNode(wrapped) &&
    isUtilityType(originalSymbol(reference.name, checker))
    ? withoutUtilityTypes(
        { name: wrapped.typeName, typeArguments: wrapped.typeArguments },
        checker,
      )
    : reference;
}

function isUtilityType(symbol: TsSymbol | undefined) {
  return !!symbol && utilityTypes.includes(symbol.name);
}

function originalSymbol(name: Node, checker: TypeChecker) {
  const symbol = checker.getSymbolAtLocation(name);

  return symbol && symbol.flags & SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
}

/**
 * A name without a building declaration is a value, such as a mixin call or a
 * variable holding a class, so its type tells what it builds on.
 */
function symbolsBehind(
  name: Node,
  symbol: TsSymbol | undefined,
  checker: TypeChecker,
) {
  if (symbol?.declarations?.some(isBuildingDeclaration)) {
    return [symbol];
  }

  const type = checker.getTypeAtLocation(name);

  return (type.isIntersection() ? type.types : [type]).flatMap(
    (part) => part.getSymbol() ?? [],
  );
}

function isContract(symbol: TsSymbol | undefined) {
  return symbol?.name === CONTRACT;
}

/** What the type parameters of a declaration stand for at one reference to it. */
function typeArgumentsOf(
  declaration: BuildingDeclaration,
  written: NodeArray<TypeNode> | undefined,
  outer: ReadonlyMap<Type, Type>,
  checker: TypeChecker,
) {
  const resolved = new Map<Type, Type>();

  declaration.typeParameters?.forEach((parameter, index) => {
    const argument = written?.at(index) ?? parameter.default;

    if (argument) {
      resolved.set(
        checker.getTypeAtLocation(parameter),
        resolveType(argument, outer, checker),
      );
    }
  });

  return resolved;
}

function resolveType(
  node: TypeNode,
  typeArguments: ReadonlyMap<Type, Type>,
  checker: TypeChecker,
) {
  const type = checker.getTypeFromTypeNode(node);

  return typeArguments.get(type) ?? type;
}

/** The `type` of the config, which is the key a form refers to. */
function configTypeLiteral(config: Type | undefined, checker: TypeChecker) {
  const property = config?.getProperty('type');
  const type = property && checker.getTypeOfSymbol(property);

  return type?.isStringLiteral() ? type.value : undefined;
}
