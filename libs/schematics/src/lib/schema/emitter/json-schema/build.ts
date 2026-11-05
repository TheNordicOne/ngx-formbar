import { SchematicsException } from '@angular-devkit/schematics';
import { FormModel, FormNode, Property, TypeNode, TypeRef } from '../../model';
import { toJsonTypes } from '../../json-types';

export interface Dialect {
  id: string;
  defsKeyword: '$defs' | 'definitions';
  /** Draft 2020-12 types tuple positions with `prefixItems`, draft-07 with an `items` array. */
  positionalKeyword: 'prefixItems' | 'items';
  /** Types the items past those positions. */
  furtherKeyword: 'items' | 'additionalItems';
}

export const DRAFT_2020_12: Dialect = {
  id: 'https://json-schema.org/draft/2020-12/schema',
  defsKeyword: '$defs',
  positionalKeyword: 'prefixItems',
  furtherKeyword: 'items',
};

export const DRAFT_07: Dialect = {
  id: 'http://json-schema.org/draft-07/schema#',
  defsKeyword: 'definitions',
  positionalKeyword: 'items',
  furtherKeyword: 'additionalItems',
};

export interface JsonSchemaOptions {
  docs: boolean;
}

/** A schema is an object or, since draft-06, a bare boolean. */
type JsonSchema = object | boolean;

/** A declared object being expanded, and the definition name it was hoisted under. */
interface Scope {
  typeName: string;
  defName: string;
}

/**
 * Carries the definitions table so a recursive declared object can be hoisted
 * into the definitions and referenced, rather than inlined forever.
 */
interface BuildContext {
  dialect: Dialect;
  options: JsonSchemaOptions;
  defs: Record<string, JsonSchema>;
  /** Node and union names mapped to the definition each one was claimed under. */
  names: Map<string, string>;
  /** Each declared object already defined, keyed by `shapeKey`. */
  shapes: Map<string, string>;
  /** Outermost first: the declared objects currently being expanded. */
  enclosing: Scope[];
}

export function buildJsonSchema(
  model: FormModel,
  dialect: Dialect,
  options: JsonSchemaOptions,
): object {
  const defs: Record<string, JsonSchema> = {};
  const ctx: BuildContext = {
    dialect,
    options,
    defs,
    names: new Map(),
    shapes: new Map(),
    enclosing: [],
  };
  const rootName = model.root.name ?? 'FormContent';
  const unions = collectUnions(model, rootName);

  // Every name is claimed before any node is built, so a declared object inside
  // one node cannot take a name a later node or a union still needs. A node
  // name and a union alias reserving the same slot is a genuine authoring
  // collision, not something to paper over with a suffix.
  for (const node of Object.values(model.nodes)) {
    reserveDefName(node.name, ctx);
  }

  for (const name of Object.keys(unions)) {
    reserveDefName(name, ctx);
  }

  for (const [name, ref] of Object.entries(unions)) {
    defs[defNameOf(name, ctx)] = buildRef(ref, ctx);
  }

  for (const node of Object.values(model.nodes)) {
    defs[defNameOf(node.name, ctx)] = buildNode(node, ctx);
  }

  return {
    $schema: dialect.id,
    type: 'object',
    properties: {
      // A form document normally carries `$schema` to bind an editor to this
      // file; the library itself only ever reads `content`.
      $schema: { type: 'string' },
      content: {
        type: 'object',
        additionalProperties: withConstraints(
          { $ref: refPath(defNameOf(rootName, ctx), dialect) },
          model.root.constraints,
          ctx,
        ),
      },
    },
    required: ['content'],
    additionalProperties: false,
    [dialect.defsKeyword]: defs,
  };
}

function buildNode(node: FormNode, ctx: BuildContext) {
  const { properties, required } = buildProperties(node.properties, ctx);

  const childSchema =
    node.children &&
    withConstraints(
      {
        $ref: refPath(
          defNameOf(childRefName(node.name, node.children), ctx),
          ctx.dialect,
        ),
      },
      node.children.constraints,
      ctx,
    );

  if (childSchema && node.kind === 'group') {
    properties['controls'] = {
      type: 'object',
      additionalProperties: childSchema,
    };
    required.push('controls');
  }

  if (childSchema && node.kind === 'array') {
    properties['rowControl'] = childSchema;
    required.push('rowControl');
  }

  // `type` leads, so a reader of the document sees which node it identifies
  // before the properties that node declares.
  return withDoc(
    {
      type: 'object',
      properties: { type: discriminant(node), ...properties },
      required: ['type', ...required],
      additionalProperties: node.open,
    },
    node.doc,
    ctx.options,
  );
}

function discriminant(node: FormNode) {
  const literals = node.typeLiteral;

  return literals === null
    ? { type: 'string' }
    : literals.length === 1
      ? { const: literals[0] }
      : { enum: literals };
}

/**
 * A `$ref` suppresses its siblings in draft-07, so a narrowing needs an `allOf`
 * arm of its own rather than sitting next to the reference.
 *
 * That arm carries `properties` and `required` only. `additionalProperties`
 * would be read against the arm alone, where every property the referenced node
 * contributes is unknown, and would reject all of them.
 */
function withConstraints(
  schema: { $ref: string },
  constraints: Property[] | undefined,
  ctx: BuildContext,
) {
  if (!constraints?.length) {
    return schema;
  }

  const { properties, required } = buildProperties(constraints, ctx);

  return {
    allOf: [
      schema,
      required.length > 0 ? { properties, required } : { properties },
    ],
  };
}

/**
 * The root union plus every child union a group or an array points at. Each one
 * needs a definition of its own, or the `$ref` `buildNode` emits dangles.
 */
function collectUnions(model: FormModel, rootName: string) {
  const unions: Record<string, TypeRef> = { [rootName]: model.root };

  for (const node of Object.values(model.nodes)) {
    if (node.children) {
      unions[childRefName(node.name, node.children)] = node.children;
    }
  }

  return unions;
}

function reserveDefName(name: string, ctx: BuildContext) {
  if (ctx.names.has(name)) {
    throw new SchematicsException(
      `A union alias and a node both claim the definition name "${name}".`,
    );
  }

  ctx.names.set(name, claimDefName(name, ctx));
}

function defNameOf(name: string, ctx: BuildContext) {
  const defName = ctx.names.get(name);

  if (defName === undefined) {
    throw new SchematicsException(
      `No definition name is reserved for "${name}".`,
    );
  }

  return defName;
}

function childRefName(nodeName: string, children: TypeRef) {
  return children.name ?? `${nodeName}Children`;
}

/**
 * A narrowing written on a single arm belongs to the union itself, so it travels
 * with the definition to every use. One applied to the whole union belongs to
 * the use that applied it and stays out of here, or it would leak.
 */
function buildRef(ref: TypeRef, ctx: BuildContext) {
  return {
    anyOf: ref.members.map((member) =>
      withConstraints(
        { $ref: refPath(defNameOf(member, ctx), ctx.dialect) },
        ref.memberConstraints?.[member],
        ctx,
      ),
    ),
  };
}

function assembleProperties(
  source: Property[],
  toSchema: (property: Property) => JsonSchema,
) {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  for (const property of source) {
    properties[property.name] = toSchema(property);

    if (!property.optional) {
      required.push(property.name);
    }
  }

  return { properties, required };
}

/** Properties straight off the model, projected onto their JSON part on the way in. */
function buildProperties(source: Property[], ctx: BuildContext) {
  return assembleProperties(source, (property) => buildProperty(property, ctx));
}

/**
 * `toJsonTypes` recurses the whole subtree, so everything below `buildType` was
 * projected by the `buildProperty` call that started the descent. Projecting
 * again here would repeat that walk once per level of nesting.
 */
function buildProjectedProperties(source: Property[], ctx: BuildContext) {
  return assembleProperties(source, (property) =>
    withDoc(buildType(property.type, ctx), property.doc, ctx.options),
  );
}

function buildProperty(property: Property, ctx: BuildContext) {
  const projected = toJsonTypes(property.type);
  // No JSON value satisfies a type that projects away entirely, so nothing is valid here.
  const schema = projected === null ? false : buildType(projected, ctx);

  return withDoc(schema, property.doc, ctx.options);
}

function buildType(type: TypeNode, ctx: BuildContext): JsonSchema {
  switch (type.k) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
      return { type: type.k };
    case 'literal':
      return { const: type.value };
    case 'array':
      return { type: 'array', items: buildType(type.items, ctx) };
    case 'tuple':
      return buildTuple(type, ctx);
    case 'union':
      return { anyOf: type.members.map((member) => buildType(member, ctx)) };
    case 'ref':
      return { $ref: refPath(defNameOf(type.node, ctx), ctx.dialect) };
    case 'cycle':
      return { $ref: refPath(cycleDefName(type.name, ctx), ctx.dialect) };
    case 'object':
      return buildObject(type, ctx);
    case 'function':
    case 'never':
      // `buildProperty` projects every type first, so these never arrive. The
      // arm only keeps the switch exhaustive for `TypeNode`.
      return false;
    case 'unknown':
    case 'any':
      return {};
  }
}

/**
 * Both drafts reject an empty positional list, so a tuple with no
 * positions types every item through `items` alone.
 */
function buildTuple(
  type: Extract<TypeNode, { k: 'tuple' }>,
  ctx: BuildContext,
) {
  const positions = type.elements.map((element) => buildType(element, ctx));
  const further = type.rest ? buildType(type.rest, ctx) : false;
  const length = type.minItems > 0 ? { minItems: type.minItems } : {};

  if (positions.length === 0) {
    return { type: 'array', items: further, ...length };
  }

  return {
    type: 'array',
    [ctx.dialect.positionalKeyword]: positions,
    [ctx.dialect.furtherKeyword]: further,
    ...length,
  };
}

/**
 * A declared object is hoisted into the definitions table and referenced, so a
 * `{ k: 'cycle' }` pointing back at it resolves. The name is claimed before
 * recursing, otherwise a self-referential shape would recurse forever.
 *
 * `name` comes from `checker.typeToString`, so it is not unique: two same-named
 * interfaces in different files both print as `Options`, and `Record<string, X>`
 * gets a name too. A definition is therefore shared by identical shapes only,
 * and a `cycle` binds to the lexically enclosing object rather than to whatever
 * the flat table happens to hold under that name.
 */
function buildObject(
  type: Extract<TypeNode, { k: 'object' }>,
  ctx: BuildContext,
) {
  const { name } = type;

  if (name === undefined) {
    return buildObjectBody(type, ctx);
  }

  const key = shapeKey(type, ctx);
  const existing = ctx.shapes.get(key);

  if (existing !== undefined) {
    return { $ref: refPath(existing, ctx.dialect) };
  }

  const defName = claimDefName(name, ctx);
  ctx.shapes.set(key, defName);

  ctx.enclosing.push({ typeName: name, defName });
  ctx.defs[defName] = buildObjectBody(type, ctx);
  ctx.enclosing.pop();

  return { $ref: refPath(defName, ctx.dialect) };
}

/**
 * A shape that cycles out to an enclosing object reads differently under each
 * enclosing definition, so where its free cycles bind is part of its identity.
 */
function shapeKey(type: TypeNode, ctx: BuildContext) {
  const bindings = freeCycles(type, []).map((name) => cycleDefName(name, ctx));

  return JSON.stringify([type, bindings]);
}

function freeCycles(type: TypeNode, bound: string[]): string[] {
  switch (type.k) {
    case 'cycle':
      return bound.includes(type.name) ? [] : [type.name];
    case 'array':
      return freeCycles(type.items, bound);
    case 'tuple':
      return [...type.elements, ...(type.rest ? [type.rest] : [])].flatMap(
        (child) => freeCycles(child, bound),
      );
    case 'union':
      return type.members.flatMap((member) => freeCycles(member, bound));
    case 'object':
      return [
        ...type.properties.map((property) => property.type),
        ...(type.index ? [type.index] : []),
      ].flatMap((child) =>
        freeCycles(
          child,
          type.name === undefined ? bound : [...bound, type.name],
        ),
      );
    default:
      return [];
  }
}

function buildObjectBody(
  type: Extract<TypeNode, { k: 'object' }>,
  ctx: BuildContext,
) {
  const { properties, required } = buildProjectedProperties(
    type.properties,
    ctx,
  );

  return {
    type: 'object',
    properties,
    required,
    // An index signature that projects to nothing leaves no valid extra property.
    additionalProperties: type.index ? buildType(type.index, ctx) : false,
  };
}

/** The innermost match wins, so a nested shape reusing a name shadows the outer one. */
function cycleDefName(name: string, ctx: BuildContext) {
  const scope = [...ctx.enclosing]
    .reverse()
    .find((entry) => entry.typeName === name);

  if (!scope) {
    throw new SchematicsException(
      `The type ${name} is referenced as a cycle but no enclosing shape of that name is being expanded.`,
    );
  }

  return scope.defName;
}

/**
 * Type names print with `<`, `"`, `/`, `~` and spaces. Reducing them to an
 * identifier keeps every `$ref` a valid JSON Pointer and URI fragment without
 * escaping, so the definitions stay readable in an editor.
 */
function claimDefName(preferred: string, ctx: BuildContext) {
  const base = toIdentifier(preferred);
  let name = base;
  let suffix = 2;

  while (name in ctx.defs) {
    name = `${base}${String(suffix)}`;
    suffix += 1;
  }

  ctx.defs[name] = {};

  return name;
}

function withDoc(
  schema: JsonSchema,
  doc: string | undefined,
  options: JsonSchemaOptions,
) {
  return !options.docs || doc === undefined || typeof schema !== 'object'
    ? schema
    : { ...schema, description: doc };
}

function toIdentifier(name: string) {
  return name.replace(/[^\w$]+/g, '_').replace(/^_+|_+$/g, '') || 'Type';
}

function refPath(name: string, dialect: Dialect) {
  return `#/${dialect.defsKeyword}/${name}`;
}
