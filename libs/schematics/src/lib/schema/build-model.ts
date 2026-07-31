import { SchematicsException } from '@angular-devkit/schematics';
import {
  displayPartsToString,
  IndexKind,
  InterfaceDeclaration,
  isInterfaceDeclaration,
  Node,
  Symbol as TsSymbol,
  SymbolFlags,
  SyntaxKind,
  Type,
  TypeChecker,
  TypeFlags,
} from 'typescript';
import {
  FormModel,
  FormNode,
  NodeKind,
  Property,
  TypeNode,
  TypeRef,
} from './model';

const CORE_BASES: Record<string, NodeKind> = {
  NgxFbControl: 'control',
  NgxFbFormGroup: 'group',
  NgxFbArray: 'array',
  NgxFbBlock: 'block',
};

const STRUCTURAL_PROPERTIES: Record<NodeKind, string | null> = {
  control: null,
  block: null,
  group: 'controls',
  array: 'rowControl',
};

interface Builder {
  checker: TypeChecker;
  coreRoot: string;
  docs: boolean;
  /** A Map, not a Record, so a miss is typed as `undefined` while building. */
  nodes: Map<string, FormNode>;
  /** Every name that will become a node, collected before any node is built. */
  nodeNames: Set<string>;
}

export function buildModel(
  type: Type,
  checker: TypeChecker,
  coreRoot: string,
  docs: boolean,
): FormModel {
  const builder: Builder = {
    checker,
    coreRoot,
    docs,
    nodes: new Map(),
    nodeNames: new Set(),
  };

  // Names are collected up front so a property referencing another node emits a
  // reference no matter where that node sits in the union.
  for (const member of unionMembers(type)) {
    collectNodeName(member, builder);
  }

  const root = toTypeRef(type, builder);

  for (const member of unionMembers(type)) {
    addNode(member, builder);
  }

  return { root, nodes: Object.fromEntries(builder.nodes) };
}

function collectNodeName(type: Type, builder: Builder) {
  const name = nodeName(type, builder.checker);

  if (builder.nodeNames.has(name)) {
    return;
  }

  builder.nodeNames.add(name);

  const structural = STRUCTURAL_PROPERTIES[resolveKind(type, builder)];
  const itemType = structural
    ? structuralItemType(type, structural, builder)
    : undefined;

  if (!itemType) {
    return;
  }

  for (const member of unionMembers(itemType)) {
    collectNodeName(member, builder);
  }
}

function addNode(type: Type, builder: Builder) {
  const name = nodeName(type, builder.checker);

  if (builder.nodes.has(name)) {
    return;
  }

  const kind = resolveKind(type, builder);
  const structural = STRUCTURAL_PROPERTIES[kind];

  // Reserve the slot before recursing so a self-referential union terminates.
  const node: FormNode = {
    name,
    kind,
    typeLiteral: null,
    open: hasIndexSignature(type, builder.checker),
    properties: [],
    doc: builder.docs ? docOf(type.getSymbol(), builder.checker) : undefined,
  };
  builder.nodes.set(name, node);

  node.typeLiteral = readTypeLiteral(type, builder.checker);
  node.children = readChildren(type, structural, builder);
  node.properties = type
    .getProperties()
    .filter((symbol) => symbol.getName() !== 'type')
    .filter((symbol) => symbol.getName() !== structural)
    .map((symbol) => toProperty(symbol, builder, new Map()));
}

/**
 * Kind comes from the core base an interface extends. This walks heritage
 * clauses on the declaration rather than `checker.getBaseTypes`, because an
 * instantiated generic such as `GroupControl<AppContent>` is a TypeReference,
 * not an InterfaceType, and `isClassOrInterface()` is false for it.
 */
function resolveKind(type: Type, builder: Builder) {
  const declaration = type
    .getSymbol()
    ?.declarations?.find(isInterfaceDeclaration);
  const kind = declaration ? kindFromHeritage(declaration, builder) : null;

  if (!kind) {
    throw new SchematicsException(
      `${builder.checker.typeToString(type)} does not extend a @ngx-formbar/core base type.`,
    );
  }

  return kind;
}

function kindFromHeritage(
  declaration: InterfaceDeclaration,
  builder: Builder,
): NodeKind | null {
  for (const clause of declaration.heritageClauses ?? []) {
    if (clause.token !== SyntaxKind.ExtendsKeyword) {
      continue;
    }

    for (const heritage of clause.types) {
      const baseDeclaration = resolveInterfaceDeclaration(
        heritage.expression,
        builder,
      );

      if (!baseDeclaration) {
        continue;
      }

      const coreKind = coreBaseKind(baseDeclaration, builder.coreRoot);

      if (coreKind) {
        return coreKind;
      }

      const inherited = kindFromHeritage(baseDeclaration, builder);

      if (inherited) {
        return inherited;
      }
    }
  }

  return null;
}

function coreBaseKind(declaration: InterfaceDeclaration, coreRoot: string) {
  const file = declaration.getSourceFile().fileName;
  return file.startsWith(coreRoot)
    ? (CORE_BASES[declaration.name.text] ?? null)
    : null;
}

/** Base types are always imported in a real consumer, so the alias must be followed. */
function resolveInterfaceDeclaration(expression: Node, builder: Builder) {
  const symbol = builder.checker.getSymbolAtLocation(expression);

  if (!symbol) {
    return undefined;
  }

  const resolved =
    (symbol.flags & SymbolFlags.Alias) !== 0
      ? builder.checker.getAliasedSymbol(symbol)
      : symbol;

  return resolved.declarations?.find(isInterfaceDeclaration);
}

function readChildren(
  type: Type,
  structural: string | null,
  builder: Builder,
): TypeRef | undefined {
  if (!structural) {
    return undefined;
  }

  const itemType = structuralItemType(type, structural, builder);

  if (!itemType) {
    return undefined;
  }

  for (const member of unionMembers(itemType)) {
    addNode(member, builder);
  }

  return toTypeRef(itemType, builder);
}

/** A group holds its children behind an index signature, an array holds one row type. */
function structuralItemType(type: Type, structural: string, builder: Builder) {
  const property = type.getProperty(structural);

  if (!property) {
    return undefined;
  }

  const propertyType = builder.checker.getTypeOfSymbol(property);

  return structural === 'controls'
    ? (indexedValueType(propertyType, builder.checker) ?? propertyType)
    : propertyType;
}

function toProperty(symbol: TsSymbol, builder: Builder, open: OpenTypes) {
  const name = symbol.getName();

  return {
    name,
    optional: (symbol.flags & SymbolFlags.Optional) !== 0,
    doc: builder.docs ? docOf(symbol, builder.checker) : undefined,
    type: toTypeNode(builder.checker.getTypeOfSymbol(symbol), builder, {
      open,
      property: name,
    }),
  };
}

/**
 * Every object type currently being expanded, mapped to the name a cycle reports.
 * Anonymous types map to `undefined`: they still have to be tracked, or a loop that
 * closes on one never terminates, but they cannot be named in the model.
 */
type OpenTypes = ReadonlyMap<Type, string | undefined>;

interface Expansion {
  open: OpenTypes;
  /** The property whose type is being expanded, named in cycle diagnostics. */
  property: string;
}

function toTypeNode(
  type: Type,
  builder: Builder,
  expansion: Expansion,
): TypeNode {
  const { checker } = builder;

  // The intrinsic `boolean` is itself a `true | false` union, so it has to be
  // recognised before the union branch or it decomposes into two literals.
  if ((type.flags & TypeFlags.Boolean) !== 0) {
    return { k: 'boolean' };
  }

  if (type.isUnion()) {
    return {
      k: 'union',
      members: collapseBooleanArms(
        type.types
          .filter((member) => (member.flags & TypeFlags.Undefined) === 0)
          .map((member) => toTypeNode(member, builder, expansion)),
      ),
    };
  }

  if (type.isStringLiteral()) {
    return { k: 'literal', value: type.value };
  }

  if (type.isNumberLiteral()) {
    return { k: 'literal', value: type.value };
  }

  if ((type.flags & TypeFlags.BooleanLiteral) !== 0) {
    return { k: 'literal', value: checker.typeToString(type) === 'true' };
  }

  if ((type.flags & TypeFlags.String) !== 0) {
    return { k: 'string' };
  }

  if ((type.flags & TypeFlags.Number) !== 0) {
    return { k: 'number' };
  }

  if ((type.flags & TypeFlags.Null) !== 0) {
    return { k: 'null' };
  }

  if ((type.flags & TypeFlags.Unknown) !== 0) {
    return { k: 'unknown' };
  }

  if ((type.flags & TypeFlags.Any) !== 0) {
    return { k: 'any' };
  }

  if (type.getCallSignatures().length > 0) {
    return { k: 'function' };
  }

  if (checker.isArrayType(type)) {
    const items = checker.getIndexTypeOfType(type, IndexKind.Number);
    return items
      ? { k: 'array', items: toTypeNode(items, builder, expansion) }
      : { k: 'array', items: { k: 'unknown' } };
  }

  const referenced = nodeName(type, checker);

  if (builder.nodeNames.has(referenced)) {
    return { k: 'ref', node: referenced };
  }

  if (expansion.open.has(type)) {
    return cycleNode(type, expansion, checker);
  }

  const name = declaredName(type, checker);
  const nested = new Map(expansion.open).set(type, name);

  return {
    k: 'object',
    name,
    properties: type
      .getProperties()
      .map((symbol) => toProperty(symbol, builder, nested)),
    index: indexSignatureType(type, checker, builder, {
      ...expansion,
      open: nested,
    }),
  };
}

/** An anonymous shape has no name to point back at, so the cycle cannot be expressed. */
function cycleNode(type: Type, expansion: Expansion, checker: TypeChecker) {
  const name = expansion.open.get(type);

  if (name === undefined) {
    throw new SchematicsException(
      `Property "${expansion.property}" cycles through the anonymous type ${checker.typeToString(type)}. Extract it into a named interface or type alias so the schema can reference it.`,
    );
  }

  return { k: 'cycle', name } satisfies TypeNode;
}

/** Inline type literals report the synthetic `__type`, so only declared shapes get a name. */
function declaredName(type: Type, checker: TypeChecker) {
  const symbolName = (type.aliasSymbol ?? type.getSymbol())?.getName();

  return symbolName !== undefined && !symbolName.startsWith('__')
    ? checker.typeToString(type)
    : undefined;
}

/**
 * A wider union flattens `boolean` into separate `true` and `false` arms.
 * Folding the pair back keeps the model faithful to the written type.
 */
function collapseBooleanArms(members: TypeNode[]): TypeNode[] {
  const literals = members.filter(isBooleanLiteralNode);

  if (literals.length !== 2) {
    return members;
  }

  const [first, second] = literals;

  return members
    .filter((member) => member !== second)
    .map((member) => (member === first ? { k: 'boolean' } : member));
}

function isBooleanLiteralNode(node: TypeNode) {
  return node.k === 'literal' && typeof node.value === 'boolean';
}

function toTypeRef(type: Type, builder: Builder): TypeRef {
  const constituents = type.isUnion() ? type.types : [type];
  const members = constituents.map((constituent) =>
    nodeName(toDeclaredNode(constituent), builder.checker),
  );

  return {
    name: aliasName(type),
    members,
    ...narrowingFields(
      members,
      constituents.map((constituent) => narrowingOf(constituent, builder)),
    ),
  };
}

/**
 * The narrowing `toDeclaredNode` drops has to travel with the reference, or the
 * schema accepts what the type rejects. Where it travels depends on how it was
 * written. An intersection applied to the whole union reaches every member alike
 * and belongs to the use that applied it, as `NgxFbArray` does to its row. One
 * written on a single arm belongs to the union itself and travels with it.
 */
function narrowingFields(members: string[], narrowings: Property[][]) {
  const named = members
    .map((member, index) => [member, narrowings[index]] as const)
    .filter(([, narrowing]) => narrowing.length > 0);

  if (named.length === 0) {
    return {};
  }

  return isUniform(narrowings)
    ? { constraints: narrowings[0] }
    : { memberConstraints: Object.fromEntries(named) };
}

function isUniform(narrowings: Property[][]) {
  const [first, ...rest] = narrowings;
  const expected = JSON.stringify(first);

  return rest.every((narrowing) => JSON.stringify(narrowing) === expected);
}

/** Everything the intersection adds beyond the declared interface that names the node. */
function narrowingOf(type: Type, builder: Builder) {
  if (!type.isIntersection()) {
    return [];
  }

  const declared = type.types.filter(isDeclaredInterface);

  if (declared.length !== 1) {
    return [];
  }

  return type.types
    .filter((member) => member !== declared[0])
    .flatMap((member) => member.getProperties())
    .map((symbol) => toProperty(symbol, builder, new Map()));
}

/** Node names are the bare interface name; instantiated generics print their arguments. */
function nodeName(type: Type, checker: TypeChecker) {
  return checker.typeToString(type).replace(/<.*>$/, '');
}

function unionMembers(type: Type) {
  return (type.isUnion() ? type.types : [type]).map(toDeclaredNode);
}

/**
 * `NgxFbArray` narrows its row as `T & { hideStrategy?: 'keep' }`, so every
 * member of an array's row union arrives as an intersection: no symbol of its
 * own, no declaration, and a name that prints the whole intersection. The
 * declared interface in it is the node; the narrowing rides on a property that
 * node already declares. An intersection of two declared interfaces is left
 * alone, so `resolveKind` reports it rather than picking one arm silently.
 */
function toDeclaredNode(type: Type) {
  if (!type.isIntersection()) {
    return type;
  }

  const declared = type.types.filter(isDeclaredInterface);

  return declared.length === 1 ? declared[0] : type;
}

function isDeclaredInterface(type: Type) {
  return type.getSymbol()?.declarations?.some(isInterfaceDeclaration) === true;
}

function aliasName(type: Type) {
  return type.aliasSymbol?.getName() ?? null;
}

function readTypeLiteral(type: Type, checker: TypeChecker) {
  const property = type.getProperty('type');

  if (!property) {
    return null;
  }

  const propertyType = checker.getTypeOfSymbol(property);
  return propertyType.isStringLiteral() ? propertyType.value : null;
}

function hasIndexSignature(type: Type, checker: TypeChecker) {
  return checker.getIndexInfosOfType(type).length > 0;
}

function indexSignatureType(
  type: Type,
  checker: TypeChecker,
  builder: Builder,
  expansion: Expansion,
) {
  const valueType = indexedValueType(type, checker);
  return valueType ? toTypeNode(valueType, builder, expansion) : undefined;
}

function indexedValueType(type: Type, checker: TypeChecker) {
  return checker.getIndexInfosOfType(type).at(0)?.type;
}

function docOf(symbol: TsSymbol | undefined, checker: TypeChecker) {
  const comment = symbol?.getDocumentationComment(checker);
  const text = comment ? displayPartsToString(comment) : '';
  return text === '' ? undefined : text;
}
