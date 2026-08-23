import { Property, TypeNode } from './model';

/**
 * Projects a type onto the part of it that can exist in JSON.
 * Returns null when no JSON value satisfies the type.
 */
export function toJsonTypes(type: TypeNode): TypeNode | null {
  switch (type.k) {
    case 'function':
    case 'never':
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

function projectObject(
  type: Extract<TypeNode, { k: 'object' }>,
): TypeNode | null {
  const properties: Property[] = [];

  for (const property of type.properties) {
    const projected = toJsonTypes(property.type);

    if (projected === null) {
      // An optional property with no JSON form can simply be left out. A
      // required one cannot: no JSON value satisfies the object, so the object
      // projects to nothing, just as a node's own required function-valued
      // property does.
      if (!property.optional) {
        return null;
      }

      continue;
    }

    properties.push({ ...property, type: projected });
  }

  return {
    k: 'object',
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
