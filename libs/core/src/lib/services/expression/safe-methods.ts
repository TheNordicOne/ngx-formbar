type SafeMethods = {
  string: string[];
  number: string[];
  boolean: string[];
  array: string[];
};

const SAFE_METHODS: SafeMethods = {
  string: [
    'charAt',
    'concat',
    'includes',
    'endsWith',
    'indexOf',
    'lastIndexOf',
    'padEnd',
    'padStart',
    'repeat',
    'replace',
    'slice',
    'split',
    'startsWith',
    'substring',
    'toLowerCase',
    'toUpperCase',
    'trim',
    'trimEnd',
    'trimStart',
    'toString',
  ],
  number: ['toFixed', 'toPrecision', 'toString'],
  boolean: ['toString'],
  array: [
    'concat',
    'every',
    'filter',
    'find',
    'findIndex',
    'includes',
    'indexOf',
    'join',
    'lastIndexOf',
    'map',
    'reduce',
    'reduceRight',
    'slice',
    'some',
    'toString',
  ],
} as const;

export type Callable = (...args: unknown[]) => unknown;

export function isAllowedMethod(object: unknown, methodName: string): boolean {
  if (Array.isArray(object)) {
    return SAFE_METHODS.array.includes(methodName);
  }
  const type = typeof object;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return SAFE_METHODS[type].includes(methodName);
  }
  return false;
}

export function readMethod(
  object: unknown,
  name: string,
): Callable | undefined {
  const value = (object as Record<string, unknown>)[name];
  return typeof value === 'function' ? (value as Callable) : undefined;
}
