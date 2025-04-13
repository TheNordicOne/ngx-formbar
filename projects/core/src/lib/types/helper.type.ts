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
export type OneOf<T extends readonly unknown[]> = {
  [K in keyof T]: T[K] extends { type: unknown }
    ? T[K] &
        Partial<
          Record<Exclude<keyof Exclude<T[number], T[K]>, keyof T[K]>, never>
        >
    : never;
}[number];
