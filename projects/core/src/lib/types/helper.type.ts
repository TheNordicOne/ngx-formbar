type OnlyFirst<F, S> = F & { [Key in keyof Omit<S, keyof F>]?: never };

/**
 * Creates a discriminated union type where each member has properties of exactly one type
 * from the provided array plus any shared properties, but none of the unique properties from other types
 *
 * Use this when defining your forms in TypeScript, to get better type safety,
 *
 * @template T - Array of types to create the discriminated union from
 *
 * @example
 * import { NgxFwFormGroup } from '../../lib';
 *
 * // Define test control types
 * export type TestTextControl = NgxFwControl & {
 *   type: 'test-text-control';
 *   hint?: string;
 *   defaultValue?: string;
 * };
 *
 * export type TestGroup = NgxFwFormGroup & {
 *   type: 'test-group';
 * };
 *
 * // Create a union type where each control can only have its own properties
 * type MyAppControls = OneOf<[TestTextControl, TestGroup]>;
 *
 * export const someControls: MyAppControls[] = [
 *   {
 *     id: 'first',
 *     type: 'test-text-control',
 *     label: 'First',
 *     defaultValue: 'default-first',
 *     // adding anything from test-group in here will throw an error
 *   },
 *   {
 *     type: 'test-group',
 *     id: 'first-group',
 *     title: 'First Group',
 *     controls: [],
 *   },
 * ];
 */
export type OneOf<T extends unknown[]> = {
  [K in keyof T]: OnlyFirst<T[K], Exclude<T[number], T[K]>>;
}[number];
