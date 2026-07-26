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
import { FormModel, FormNode, NodeKind, TypeNode, TypeRef } from './model';

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
}

export function buildModel(
  type: Type,
  checker: TypeChecker,
  coreRoot: string,
  docs: boolean,
): FormModel {
  const builder: Builder = { checker, coreRoot, docs, nodes: new Map() };
  const root = toTypeRef(type, checker, null);

  for (const member of unionMembers(type)) {
    addNode(member, builder);
  }

  return { root, nodes: Object.fromEntries(builder.nodes) };
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
    .map((symbol) => toProperty(symbol, builder));
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

  const property = type.getProperty(structural);

  if (!property) {
    return undefined;
  }

  const propertyType = builder.checker.getTypeOfSymbol(property);
  const itemType =
    structural === 'controls'
      ? (indexedValueType(propertyType, builder.checker) ?? propertyType)
      : propertyType;

  for (const member of unionMembers(itemType)) {
    addNode(member, builder);
  }

  return toTypeRef(itemType, builder.checker, aliasName(itemType));
}

function toProperty(symbol: TsSymbol, builder: Builder) {
  return {
    name: symbol.getName(),
    optional: (symbol.flags & SymbolFlags.Optional) !== 0,
    doc: builder.docs ? docOf(symbol, builder.checker) : undefined,
    type: toTypeNode(builder.checker.getTypeOfSymbol(symbol), builder),
  };
}

function toTypeNode(type: Type, builder: Builder): TypeNode {
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
          .map((member) => toTypeNode(member, builder)),
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
      ? { k: 'array', items: toTypeNode(items, builder) }
      : { k: 'array', items: { k: 'unknown' } };
  }

  const name = nodeName(type, checker);

  if (builder.nodes.has(name)) {
    return { k: 'ref', node: name };
  }

  return {
    k: 'object',
    properties: type
      .getProperties()
      .map((symbol) => toProperty(symbol, builder)),
    index: indexSignatureType(type, checker, builder),
  };
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

function toTypeRef(type: Type, checker: TypeChecker, name: string | null) {
  return {
    name: name ?? aliasName(type),
    members: unionMembers(type).map((member) => nodeName(member, checker)),
  };
}

/** Node names are the bare interface name; instantiated generics print their arguments. */
function nodeName(type: Type, checker: TypeChecker) {
  return checker.typeToString(type).replace(/<.*>$/, '');
}

function unionMembers(type: Type): Type[] {
  return type.isUnion() ? type.types : [type];
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
) {
  const valueType = indexedValueType(type, checker);
  return valueType ? toTypeNode(valueType, builder) : undefined;
}

function indexedValueType(type: Type, checker: TypeChecker) {
  const infos = checker.getIndexInfosOfType(type);
  return infos.length > 0 ? infos[0].type : undefined;
}

function docOf(symbol: TsSymbol | undefined, checker: TypeChecker) {
  const comment = symbol?.getDocumentationComment(checker);
  const text = comment ? displayPartsToString(comment) : '';
  return text === '' ? undefined : text;
}
