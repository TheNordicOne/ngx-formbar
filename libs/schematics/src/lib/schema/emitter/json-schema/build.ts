import { SchematicsException } from '@angular-devkit/schematics';
import { FormModel, FormNode, Property, TypeNode, TypeRef } from '../../model';
import { toJsonTypes } from '../../json-types';
import { EmitOptions } from '../define-emitter';

export interface Dialect {
  id: string;
  defsKeyword: '$defs' | 'definitions';
}

export const DRAFT_2020_12: Dialect = {
  id: 'https://json-schema.org/draft/2020-12/schema',
  defsKeyword: '$defs',
};

export const DRAFT_07: Dialect = {
  id: 'http://json-schema.org/draft-07/schema#',
  defsKeyword: 'definitions',
};

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
  options: EmitOptions;
  defs: Record<string, JsonSchema>;
  /** Outermost first: the declared objects currently being expanded. */
  enclosing: Scope[];
}

export function buildJsonSchema(
  model: FormModel,
  dialect: Dialect,
  options: EmitOptions,
): object {
  const defs: Record<string, JsonSchema> = {};
  const ctx: BuildContext = { dialect, options, defs, enclosing: [] };
  const rootName = model.root.name ?? 'FormContent';
  const unions = collectUnions(model, rootName);

  // Every name is claimed before any node is built, so a declared object inside
  // one node cannot take a name a later node or a union still needs. A node
  // name and a union alias reserving the same slot is a genuine authoring
  // collision, not something to paper over with a suffix.
  for (const node of Object.values(model.nodes)) {
    reserveDefName(node.name, defs);
  }

  for (const name of Object.keys(unions)) {
    reserveDefName(name, defs);
  }

  for (const [name, ref] of Object.entries(unions)) {
    defs[name] = buildRef(ref, ctx);
  }

  for (const node of Object.values(model.nodes)) {
    defs[node.name] = buildNode(node, ctx);
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
          { $ref: refPath(rootName, dialect) },
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

  if (node.children) {
    const childSchema = withConstraints(
      { $ref: refPath(childRefName(node), ctx.dialect) },
      node.children.constraints,
      ctx,
    );

    if (node.kind === 'group') {
      properties['controls'] = {
        type: 'object',
        additionalProperties: childSchema,
      };
      required.push('controls');
    }

    if (node.kind === 'array') {
      properties['rowControl'] = childSchema;
      required.push('rowControl');
    }
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

  if (literals === null) {
    return { type: 'string' };
  }

  return literals.length === 1 ? { const: literals[0] } : { enum: literals };
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
      unions[childRefName(node)] = node.children;
    }
  }

  return unions;
}

function reserveDefName(name: string, defs: Record<string, JsonSchema>) {
  if (name in defs) {
    throw new SchematicsException(
      `A union alias and a node both claim the definition name "${name}".`,
    );
  }

  defs[name] = {};
}

function childRefName(node: FormNode) {
  return node.children?.name ?? `${node.name}Children`;
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
        { $ref: refPath(member, ctx.dialect) },
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
    case 'union':
      return { anyOf: type.members.map((member) => buildType(member, ctx)) };
    case 'ref':
      return { $ref: refPath(type.node, ctx.dialect) };
    case 'cycle':
      return { $ref: refPath(cycleDefName(type.name, ctx), ctx.dialect) };
    case 'object':
      return buildObject(type, ctx);
    case 'function':
    case 'never':
      // `toJsonTypes` drops these, so only a hand-built model reaches this arm.
      return false;
    case 'unknown':
    case 'any':
      return {};
  }
}

/**
 * A declared object is hoisted into the definitions table and referenced, so a
 * `{ k: 'cycle' }` pointing back at it resolves. The name is claimed before
 * recursing, otherwise a self-referential shape would recurse forever.
 *
 * `name` comes from `checker.typeToString`, so it is not unique: two same-named
 * interfaces in different files both print as `Options`, and `Record<string, X>`
 * gets a name too. Each occurrence therefore gets its own definition, and a
 * `cycle` binds to the lexically enclosing object rather than to whatever the
 * flat table happens to hold under that name.
 */
function buildObject(
  type: Extract<TypeNode, { k: 'object' }>,
  ctx: BuildContext,
) {
  const { name } = type;

  if (name === undefined) {
    return buildObjectBody(type, ctx);
  }

  const defName = claimDefName(name, ctx);

  ctx.enclosing.push({ typeName: name, defName });
  ctx.defs[defName] = buildObjectBody(type, ctx);
  ctx.enclosing.pop();

  return { $ref: refPath(defName, ctx.dialect) };
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

function claimDefName(preferred: string, ctx: BuildContext) {
  let name = preferred;
  let suffix = 2;

  while (name in ctx.defs) {
    name = `${preferred}${String(suffix)}`;
    suffix += 1;
  }

  ctx.defs[name] = {};

  return name;
}

function withDoc(
  schema: JsonSchema,
  doc: string | undefined,
  options: EmitOptions,
) {
  if (!options.docs || doc === undefined || typeof schema !== 'object') {
    return schema;
  }

  return { ...schema, description: doc };
}

function refPath(name: string, dialect: Dialect) {
  return `#/${dialect.defsKeyword}/${name}`;
}
