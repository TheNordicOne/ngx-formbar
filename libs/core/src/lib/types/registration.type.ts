import { Type } from '@angular/core';

/** Loads a component on demand, like a lazy route. */
export type LoadComponentFn = () => Promise<Type<unknown>>;

/** Registration for an eagerly imported component. */
export interface StaticRegistration {
  component: Type<unknown>;
}

/** Registration for a lazily loaded component. */
export interface LazyRegistration {
  loadComponent: LoadComponentFn;
}

/** Optional behavior flags for a component registration. */
export interface ComponentRegistrationOptions {
  /**
   * How visibility is managed for this component type.
   *
   * - `auto` (default): the library destroys the component when the resolved
   *   hidden state becomes true and recreates it when it becomes false. The
   *   configured `valueStrategy` is applied around the cycle, and `hideStrategy`
   *   decides whether the form control stays attached.
   * - `manual`: the library leaves the component mounted and only supplies the
   *   `isHidden` signal. The component handles its own hiding, value strategy,
   *   and form model attachment.
   */
  keepValueWhenHidden?: StateHandling;

  /**
   * How the disabled state is applied to the underlying form control.
   *
   * - `auto` (default): the library calls `enable()` / `disable()` on the form
   *   control when the resolved `disabled` signal changes.
   * - `manual`: the library leaves the form control alone. The component
   *   receives the `isDisabled` signal and applies it itself.
   */
  disabledHandling?: StateHandling;
}

/**
 * A component registration entry, static or lazy, with optional behavior flags.
 *
 * - Static: `{ component: MyComponent }`.
 * - Lazy: `{ loadComponent: () => import(...).then(m => m.MyComponent) }`.
 */
export type ComponentRegistrationEntry =
  | (StaticRegistration & ComponentRegistrationOptions)
  | (LazyRegistration & ComponentRegistrationOptions);

/**
 * Map from content `type` to component registration. Used when configuring
 * the library at the application level.
 */
export type ComponentRegistrationConfig = Record<
  string,
  ComponentRegistrationEntry
>;

/**
 * Who manages a component state (visibility, disabled, etc.).
 *
 * - `auto`: the library manages it.
 * - `manual`: the component manages it.
 */
export type StateHandling = 'auto' | 'manual';
