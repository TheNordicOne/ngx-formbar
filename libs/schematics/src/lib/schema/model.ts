export type NodeKind = 'control' | 'group' | 'array' | 'block';

export interface TypeRef {
  /** Name of the union alias, or null when the union was written inline. */
  name: string | null;
  members: string[];
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
  /** The narrowed `type` literal, or null when the member leaves `type` as string. */
  typeLiteral: string | null;
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
  /** `name` is set when the shape was declared, absent for an inline type literal. */
  | { k: 'object'; name?: string; properties: Property[]; index?: TypeNode }
  | { k: 'union'; members: TypeNode[] }
  | { k: 'function' }
  | { k: 'ref'; node: string }
  /** A back-reference to the enclosing `{ k: 'object' }` of the same name. */
  | { k: 'cycle'; name: string };
