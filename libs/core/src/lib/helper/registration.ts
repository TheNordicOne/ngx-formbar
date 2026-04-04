import { Type } from '@angular/core';
import {
  ComponentRegistrationOptions,
  LazyRegistration,
  LoadComponentFn,
  StaticRegistration,
} from '../types/registration.type';

/**
 * Creates a static component registration entry.
 * Use for eagerly imported components that don't need lazy loading.
 *
 * @param type The component class to register
 * @param options Optional configuration for this component type
 *
 * @example
 * ```ts
 * import { staticComponent } from '@ngx-formbar/core';
 * import { TextComponent } from './text.component';
 *
 * const registrations = {
 *   // Default: library manages visibility automatically
 *   text: staticComponent(TextComponent),
 *
 *   // Manual: component handles its own visibility
 *   custom: staticComponent(CustomComponent, { visibilityHandling: 'manual' }),
 * };
 * ```
 */
export function staticComponent(
  type: Type<unknown>,
  options?: ComponentRegistrationOptions,
): StaticRegistration & ComponentRegistrationOptions {
  return { component: type, ...options };
}

/**
 * Creates a lazy component registration entry.
 * Use for components that should be loaded on demand.
 *
 * @param load Function that returns a Promise resolving to the component class
 * @param options Optional configuration for this component type
 *
 * @example
 * ```ts
 * import { loadComponent } from '@ngx-formbar/core';
 *
 * const registrations = {
 *   // Default: library manages visibility automatically
 *   text: loadComponent(() => import('./text.component').then(m => m.TextComponent)),
 *
 *   // Manual: component handles its own visibility
 *   custom: loadComponent(
 *     () => import('./custom.component').then(m => m.CustomComponent),
 *     { visibilityHandling: 'manual' },
 *   ),
 * };
 * ```
 */
export function loadComponent(
  load: LoadComponentFn,
  options?: ComponentRegistrationOptions,
): LazyRegistration & ComponentRegistrationOptions {
  return { loadComponent: load, ...options };
}
