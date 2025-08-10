import { Type } from '@angular/core';

/**
 * Configuration for registering component types
 *
 * Used to map string type identifiers to component implementations
 * for dynamic rendering.
 */
export type ComponentRegistrationConfig = Record<string, Type<unknown>>;

/**
 * Strategy for handling component states
 *
 * Determines how visibility, disabled, and other component states
 * are managed.
 *
 * - 'auto': Formwork automatically manages the state
 * - 'manual': The component/host manages the state itself
 */
export type StateHandling = 'auto' | 'manual';
