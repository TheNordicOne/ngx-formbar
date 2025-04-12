type MergeTypes<
  TypesArray extends unknown[],
  Res = object,
> = TypesArray extends [infer Head, ...infer Rem]
  ? MergeTypes<Rem, Res & Head>
  : Res;

type OnlyFirst<F, S> = F & { [Key in keyof Omit<S, keyof F>]?: never };

/**
 * Creates a union type where each member contains exactly one set of properties
 * from the provided types array
 *
 * This is useful for creating mutually exclusive property sets where only one
 * configuration can be valid at a time.
 *
 * @template TypesArray - Array of types to create the exclusive union from
 * @template Res - Accumulator for the result (default: never)
 * @template AllProperties - Combined properties from all types
 *
 * @example
 * // Result: { type: 'text'; value: string } | { type: 'number'; value: number }
 * type Field = OneOf<[
 *   { type: 'text'; value: string },
 *   { type: 'number'; value: number }
 * ]>;
 */
export type OneOf<
  TypesArray extends unknown[],
  Res = never,
  AllProperties = MergeTypes<TypesArray>,
> = TypesArray extends [infer Head, ...infer Rem]
  ? OneOf<Rem, Res | OnlyFirst<Head, AllProperties>, AllProperties>
  : Res;
