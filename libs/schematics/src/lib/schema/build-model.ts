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
  TupleTypeReference,
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

/** Primitives that have no JSON value, so the schema can never satisfy them. */
const NON_JSON_FLAGS =
  TypeFlags.BigInt |
  TypeFlags.BigIntLiteral |
  TypeFlags.ESSymbol |
  TypeFlags.UniqueESSymbol |
  TypeFlags.Void |
  TypeFlags.Undefined |
  TypeFlags.Never;

/** An intersection holding one of these is a branded primitive, such as `string & {}`. */
const PRIMITIVE_FLAGS =
  TypeFlags.StringLike |
  TypeFlags.NumberLike |
  TypeFlags.BooleanLike |
  TypeFlags.BigIntLike |
  TypeFlags.ESSymbolLike;

/** `object` admits every object and every array. */
const ANY_OBJECT: TypeNode = {
  k: 'union',
  members: [
    { k: 'object', properties: [], index: { k: 'unknown' } },
    { k: 'array', items: { k: 'unknown' } },
  ],
};

/** `{}` admits every value except `null` and `undefined`. */
const NON_NULLISH: TypeNode = {
  k: 'union',
  members: [{ k: 'string' }, { k: 'number' }, { k: 'boolean' }, ANY_OBJECT],
};

interface Builder {
  checker: TypeChecker;
  coreRoot: string;
  /** The root union's members, which a core base child stands for. */
  registered: Type[];
  /** A Map, not a Record, so a miss is typed as `undefined` while building. */
  nodes: Map<string, FormNode>;
  /** Keyed by type identity, so each instantiation of a generic is a node of its own. */
  nodeNames: Map<Type, string>;
}

export function buildModel(
  type: Type,
  checker: TypeChecker,
  coreRoot: string,
): FormModel {
  const builder: Builder = {
    checker,
    coreRoot,
    registered: unionMembers(type),
    nodes: new Map(),
    nodeNames: new Map(),
  };
  const collected = new Set<Type>();

  // Names are collected up front so a property referencing another node emits a
  // reference no matter where that node sits in the union.
  for (const member of unionMembers(type)) {
    collectNode(member, builder, collected);
  }

  for (const [node, name] of nameNodes([...collected], checker)) {
    builder.nodeNames.set(node, name);
  }

  const root = toTypeRef(type, builder);

  for (const member of unionMembers(type)) {
    addNode(member, builder);
  }

  return { root, nodes: Object.fromEntries(builder.nodes) };
}

function collectNode(type: Type, builder: Builder, collected: Set<Type>) {
  if (collected.has(type)) {
    return;
  }

  collected.add(type);

  const structural = STRUCTURAL_PROPERTIES[resolveKind(type, builder)];
  const itemType = structural
    ? structuralItemType(type, structural, builder)
    : undefined;

  for (const member of itemType ? childMembers(itemType, builder) : []) {
    collectNode(member, builder, collected);
  }
}

/**
 * A node is named after its interface. Only a generic used with more than one
 * set of type arguments prints them, so its instantiations stay apart.
 */
function nameNodes(types: Type[], checker: TypeChecker) {
  const printed = types.map((type) => {
    const full = checker.typeToString(type);

    return { type, full, bare: full.replace(/<.*>$/, '') };
  });
  const bareCounts = new Map<string, number>();

  for (const { bare } of printed) {
    bareCounts.set(bare, (bareCounts.get(bare) ?? 0) + 1);
  }

  const taken = new Set<string>();
  const names = new Map<Type, string>();

  for (const { type, full, bare } of printed) {
    const shared = (bareCounts.get(bare) ?? 0) > 1;
    const name = uniqueName(shared ? full : bare, taken);

    taken.add(name);
    names.set(type, name);
  }

  return names;
}

/** Two unrelated interfaces can print alike, and each still needs a node. */
function uniqueName(preferred: string, taken: Set<string>) {
  let name = preferred;
  let suffix = 2;

  while (taken.has(name)) {
    name = `${preferred}${String(suffix)}`;
    suffix += 1;
  }

  return name;
}

function addNode(type: Type, builder: Builder) {
  const name = nodeName(type, builder);

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
    doc: docOf(type.getSymbol(), builder.checker),
  };
  builder.nodes.set(name, node);

  node.typeLiteral = readTypeLiterals(type, builder.checker);
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

  for (const member of childMembers(itemType, builder)) {
    addNode(member, builder);
  }

  const children = toTypeRef(itemType, builder);

  if (children.members.length === 0) {
    throw new SchematicsException(
      `${nodeName(type, builder)} takes its children from core base types, but the content union has no member of their kind.`,
    );
  }

  return children;
}

function childMembers(itemType: Type, builder: Builder) {
  return unionMembers(itemType).flatMap((member) =>
    registeredFor(member, builder),
  );
}

/**
 * A child left on a core base, as the default `NgxFbItem` of `NgxFbFormGroup`
 * and `NgxFbArray` leaves it, stands for every registered member of that kind.
 * Those are exactly the configs the registry can render, and each of them is
 * assignable to the base. The base itself has no `type` literal to discriminate
 * on, so emitting it would let a mistyped `type` pass as that base.
 */
function registeredFor(type: Type, builder: Builder) {
  const declaration = type
    .getSymbol()
    ?.declarations?.find(isInterfaceDeclaration);
  const kind = declaration ? coreBaseKind(declaration, builder.coreRoot) : null;

  return kind
    ? builder.registered.filter(
        (member) => resolveKind(member, builder) === kind,
      )
    : [type];
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
    doc: docOf(symbol, builder.checker),
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

  // Template literals and `Uppercase<string>` admit strings no JSON Schema
  // keyword describes faithfully, so they widen to `string`.
  if ((type.flags & TypeFlags.StringLike) !== 0) {
    return { k: 'string' };
  }

  if ((type.flags & TypeFlags.NumberLike) !== 0) {
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

  if ((type.flags & NON_JSON_FLAGS) !== 0) {
    return { k: 'never' };
  }

  const primitive = type.isIntersection()
    ? type.types.find((member) => (member.flags & PRIMITIVE_FLAGS) !== 0)
    : undefined;

  if (primitive) {
    return toTypeNode(primitive, builder, expansion);
  }

  if ((type.flags & TypeFlags.NonPrimitive) !== 0) {
    return ANY_OBJECT;
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

  if (isTupleReference(type, checker)) {
    return toTupleNode(type, builder, expansion);
  }

  if (isEmptyObject(type, checker)) {
    return NON_NULLISH;
  }

  const referenced = builder.nodeNames.get(type);

  if (referenced !== undefined) {
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

function isTupleReference(
  type: Type,
  checker: TypeChecker,
): type is TupleTypeReference {
  return checker.isTupleType(type);
}

/**
 * Items past the fixed leading positions, a rest element and anything after it,
 * share one type, so a rest in the middle widens to a union of what follows.
 */
function toTupleNode(
  type: TupleTypeReference,
  builder: Builder,
  expansion: Expansion,
) {
  const { fixedLength, minLength, elementFlags } = type.target;
  const items = builder.checker
    .getTypeArguments(type)
    .slice(0, elementFlags.length)
    .map((item) => toTypeNode(item, builder, expansion));
  const trailing = items.slice(fixedLength);
  const rest: TypeNode | undefined =
    trailing.length > 1 ? { k: 'union', members: trailing } : trailing.at(0);

  return {
    k: 'tuple',
    elements: items.slice(0, fixedLength),
    minItems: minLength,
    ...(rest ? { rest } : {}),
  } satisfies TypeNode;
}

/** `{}` and an empty interface place no demand on a value beyond being non-nullish. */
function isEmptyObject(type: Type, checker: TypeChecker) {
  return (
    (type.flags & TypeFlags.Object) !== 0 &&
    type.getProperties().length === 0 &&
    checker.getIndexInfosOfType(type).length === 0 &&
    type.getConstructSignatures().length === 0
  );
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
  const arms = (type.isUnion() ? type.types : [type]).flatMap((constituent) => {
    const narrowing = narrowingOf(constituent, builder);

    return registeredFor(toDeclaredNode(constituent), builder).map((node) => ({
      name: nodeName(node, builder),
      narrowing,
    }));
  });
  const members = [...new Set(arms.map((arm) => arm.name))];

  return {
    name: aliasName(type),
    members,
    ...narrowingFields(
      members,
      members.map((member) => mergedNarrowing(member, arms)),
    ),
  };
}

/**
 * A plain arm admits everything a narrowed arm of the same node does, so it
 * wins. Two different narrowings of one node form a union of their own, which
 * a single reference with one set of constraints cannot carry.
 */
function mergedNarrowing(
  member: string,
  arms: { name: string; narrowing: Property[] }[],
) {
  const narrowings = arms
    .filter((arm) => arm.name === member)
    .map((arm) => arm.narrowing);
  const plain = narrowings.some((narrowing) => narrowing.length === 0);

  if (!plain && !isUniform(narrowings)) {
    throw new SchematicsException(
      `${member} appears in one union under different narrowings. Declare each narrowing as its own interface so the schema can reference it.`,
    );
  }

  return plain ? [] : narrowings[0];
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

function narrowingOf(type: Type, builder: Builder) {
  const narrowing = splitIntersection(type)?.narrowing ?? [];

  return narrowing
    .flatMap((member) => member.getProperties())
    .map((symbol) => toProperty(symbol, builder, new Map()));
}

function nodeName(type: Type, builder: Builder) {
  return builder.nodeNames.get(type) ?? builder.checker.typeToString(type);
}

function unionMembers(type: Type) {
  return (type.isUnion() ? type.types : [type]).map(toDeclaredNode);
}

/**
 * `NgxFbArray` narrows its row as `T & { hideStrategy?: 'keep' }`, so every
 * member of an array's row union arrives as an intersection: no symbol of its
 * own, no declaration, and a name that prints the whole intersection. The
 * declared interface in it is the node; everything else narrows that node.
 * An intersection of two declared interfaces names no single node and is left
 * whole, so `resolveKind` reports it rather than picking one arm silently.
 *
 * Which arm is the node and which arms narrow it are decided here together.
 * Deciding them apart would let a narrowing be attributed to a node that was
 * never picked.
 */
function splitIntersection(type: Type) {
  if (!type.isIntersection()) {
    return undefined;
  }

  const declared = type.types.filter(isDeclaredInterface);
  const [node] = declared;

  return declared.length === 1
    ? { node, narrowing: type.types.filter((member) => member !== node) }
    : undefined;
}

function toDeclaredNode(type: Type) {
  return splitIntersection(type)?.node ?? type;
}

function isDeclaredInterface(type: Type) {
  return type.getSymbol()?.declarations?.some(isInterfaceDeclaration) === true;
}

function aliasName(type: Type) {
  return type.aliasSymbol?.getName() ?? null;
}

function readTypeLiterals(type: Type, checker: TypeChecker) {
  const property = type.getProperty('type');

  if (!property) {
    return null;
  }

  // An open `string` arm collapses the result to null. Any string is allowed,
  // so the schema must not pin literals.
  const literals: string[] = [];
  const propertyType = checker.getTypeOfSymbol(property);

  for (const member of propertyType.isUnion()
    ? propertyType.types
    : [propertyType]) {
    if (member.isStringLiteral()) {
      literals.push(member.value);
    } else if ((member.flags & TypeFlags.String) !== 0) {
      return null;
    }
  }

  return literals.length > 0 ? literals : null;
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
