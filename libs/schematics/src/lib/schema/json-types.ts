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
    case 'tuple':
      return projectTuple(type);
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

    // An optional property with no JSON form can simply be left out. A
    // required one cannot: no JSON value satisfies the object, so the object
    // projects to nothing, just as a node's own required function-valued
    // property does.
    if (projected === null && !property.optional) {
      return null;
    }

    if (projected !== null) {
      properties.push({ ...property, type: projected });
    }
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

/**
 * A position with no JSON form can only be left out, and so can every position
 * after it. Nothing satisfies the tuple once that leaves fewer than it requires.
 */
function projectTuple(
  type: Extract<TypeNode, { k: 'tuple' }>,
): TypeNode | null {
  const projected = type.elements.map(toJsonTypes);
  const cut = projected.indexOf(null);
  const elements = (cut === -1 ? projected : projected.slice(0, cut)).filter(
    (element): element is TypeNode => element !== null,
  );
  const rest =
    cut === -1 && type.rest ? (toJsonTypes(type.rest) ?? undefined) : undefined;
  const capacity = rest ? Infinity : elements.length;

  return type.minItems > capacity
    ? null
    : {
        k: 'tuple',
        elements,
        minItems: type.minItems,
        ...(rest ? { rest } : {}),
      };
}
