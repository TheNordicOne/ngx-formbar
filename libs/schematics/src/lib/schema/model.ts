export type NodeKind = 'control' | 'group' | 'array' | 'block';

export interface TypeRef {
  /** Name of the union alias, or null when the union was written inline. */
  name: string | null;
  members: string[];
  /** Properties an intersection narrowed onto every member of this union. */
  constraints?: Property[];
  /** Properties narrowed onto single members, keyed by the name in `members`. */
  memberConstraints?: Record<string, Property[]>;
}

export interface Property {
  name: string;
  optional: boolean;
  doc?: string;
  type: TypeNode;
}

export interface FormNode {
  name: string;
  kind: NodeKind;
  /**
   * The `type` literal or literals the member narrows to, or null when the
   * member leaves `type` as an open string. A single literal is still a
   * one-element list, so the emitter has one shape to handle.
   */
  typeLiteral: string[] | null;
  doc?: string;
  /** True when the node carries an index signature, as NgxFbBlock does. */
  open: boolean;
  /** Everything except `type` and the structural child property. */
  properties: Property[];
  /** Group children or array row type. */
  children?: TypeRef;
}

export interface FormModel {
  root: TypeRef;
  nodes: Record<string, FormNode>;
}

export type TypeNode =
  | { k: 'string' | 'number' | 'boolean' | 'null' | 'unknown' | 'any' }
  | { k: 'literal'; value: string | number | boolean }
  | { k: 'array'; items: TypeNode }
  /**
   * `elements` types the leading positions and `minItems` is how many items
   * must be present. `rest` types every further item; without it none is allowed.
   */
  | { k: 'tuple'; elements: TypeNode[]; minItems: number; rest?: TypeNode }
  /** `name` is set when the shape was declared, absent for an inline type literal. */
  | { k: 'object'; name?: string; properties: Property[]; index?: TypeNode }
  | { k: 'union'; members: TypeNode[] }
  | { k: 'function' }
  /** No JSON value satisfies the type, as for a non-JSON primitive such as bigint or symbol. */
  | { k: 'never' }
  | { k: 'ref'; node: string }
  /** A back-reference to the enclosing `{ k: 'object' }` of the same name. */
  | { k: 'cycle'; name: string };
