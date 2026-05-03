import { Type } from '@angular/core';

/**
 * Function that lazily loads a component.
 * Works analog to lazily loading a component for a route.
 */
export type LoadComponentFn = () => Promise<Type<unknown>>;

/**
 * Registration entry for a statically imported component.
 */
export interface StaticRegistration {
  component: Type<unknown>;
}

/**
 * Registration entry for a lazily loaded component.
 */
export interface LazyRegistration {
  loadComponent: LoadComponentFn;
}

/**
 * Optional configuration for a component registration entry.
 */
export interface ComponentRegistrationOptions {
  /**
   * Controls how visibility is managed for this component type.
   *
   * - `'auto'` (default): The library destroys the consumer component when the resolved hidden state
   *   becomes true and recreates it when the state becomes false again. The configured
   *   `valueStrategy` is applied around the cycle, and the `hideStrategy` decides whether the
   *   form control stays attached or is removed and reattached.
   * - `'manual'`: The library does not destroy or recreate the component. It still resolves and
   *   supplies the `isHidden` signal, but the component stays mounted and is responsible for
   *   its own hiding, value strategy, and form model management.
   */
  keepValueWhenHidden?: StateHandling;

  /**
   * Controls how the disabled state is applied to the underlying form control.
   *
   * - `'auto'` (default): The library calls `enable()`/`disable()` on the form control
   *   in response to changes in the resolved `disabled` signal.
   * - `'manual'`: The library does not touch the form control's disabled state. The component
   *   receives the `isDisabled` signal and is responsible for applying it itself.
   */
  disabledHandling?: StateHandling;
}

/**
 * A component registration entry, either static or lazy,
 * optionally with additional configuration.
 *
 * - Static: `{ component: MyComponent }`. Component is eagerly imported
 * - Lazy: `{ loadComponent: () => import(...).then(m => m.MyComponent) }`. Loaded on demand
 */
export type ComponentRegistrationEntry =
  | (StaticRegistration & ComponentRegistrationOptions)
  | (LazyRegistration & ComponentRegistrationOptions);

/**
 * Configuration for registering component types.
 *
 * Maps string type identifiers to component implementations for dynamic rendering.
 * Supports both static and lazy component registrations.
 */
export type ComponentRegistrationConfig = Record<
  string,
  ComponentRegistrationEntry
>;

/**
 * Strategy for handling component states
 *
 * Determines how visibility, disabled, and other component states
 * are managed.
 *
 * - 'auto': Formbar automatically manages the state
 * - 'manual': The component/host manages the state itself
 */
export type StateHandling = 'auto' | 'manual';
