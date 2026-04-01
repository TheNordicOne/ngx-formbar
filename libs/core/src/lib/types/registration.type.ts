import { Type } from '@angular/core';

/**
 * Configuration for registering component types
 *
 * Used to map string type identifiers to component implementations
 * for dynamic rendering.
 */
export type ComponentRegistrationConfig = Record<string, LoadComponentFn>;

/**
 * Function that loads a component.
 * Works analog to lazily loading a component for a route
 */
export type LoadComponentFn = () => Promise<Type<unknown>>;

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
