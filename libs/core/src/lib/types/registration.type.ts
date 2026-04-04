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
  visibilityHandling?: StateHandling;
}

/**
 * A component registration entry — either static or lazy,
 * optionally with additional configuration.
 *
 * - Static: `{ component: MyComponent }` — component is eagerly imported
 * - Lazy: `{ loadComponent: () => import(...).then(m => m.MyComponent) }` — loaded on demand
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
