import { TypeNode } from './model';

/**
 * Projects a type onto the part of it that can exist in JSON.
 * Returns null when no JSON value satisfies the type.
 *
 * Listing every variant instead of a `default` is deliberate: a new `TypeNode`
 * kind must fail to compile here rather than silently fall through unprojected.
 */
export function toJsonTypes(type: TypeNode): TypeNode | null {
  switch (type.k) {
    case 'function':
      return null;
    case 'union':
      return projectUnion(type.members);
    case 'array':
      return projectArray(type.items);
    case 'object':
      return projectObject(type);
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
    case 'unknown':
    case 'any':
    case 'literal':
    case 'ref':
    case 'cycle':
      return type;
  }
}

function projectObject(type: Extract<TypeNode, { k: 'object' }>): TypeNode {
  const properties = type.properties.flatMap((property) => {
    const projected = toJsonTypes(property.type);
    return projected ? [{ ...property, type: projected }] : [];
  });

  return {
    k: 'object',
    // `name` must survive: a `{ k: 'cycle' }` elsewhere in the tree refers to it.
    name: type.name,
    properties,
    index: type.index ? (toJsonTypes(type.index) ?? undefined) : undefined,
  };
}

/**
 * A single surviving arm is unwrapped rather than left as a one-entry union.
 * `buildModel` filters `undefined` out of an optional property's union *after*
 * the union is formed, so `children?: OptionNode[]` arrives here as a union of
 * one. Without this, every optional property would emit a one-entry `anyOf`.
 */
function projectUnion(members: TypeNode[]): TypeNode | null {
  const projected = members
    .map(toJsonTypes)
    .filter((member): member is TypeNode => member !== null);

  if (projected.length === 0) {
    return null;
  }

  return projected.length === 1
    ? projected[0]
    : { k: 'union', members: projected };
}

function projectArray(items: TypeNode): TypeNode | null {
  const projected = toJsonTypes(items);
  return projected ? { k: 'array', items: projected } : null;
}
