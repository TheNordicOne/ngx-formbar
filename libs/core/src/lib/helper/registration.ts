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
 * @example
 * ```ts
 * import { staticComponent } from '@ngx-formbar/core';
 * import { TextComponent } from './text.component';
 *
 * const registrations = {
 *   text: staticComponent(TextComponent),
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
 * @example
 * ```ts
 * import { loadComponent } from '@ngx-formbar/core';
 *
 * const registrations = {
 *   text: loadComponent(() => import('./text.component').then(m => m.TextComponent)),
 *   custom: loadComponent(() => import('./custom.component').then(m => m.CustomComponent), { visibilityHandling: 'manual' }),
 * };
 * ```
 */
export function loadComponent(
  load: LoadComponentFn,
  options?: ComponentRegistrationOptions,
): LazyRegistration & ComponentRegistrationOptions {
  return { loadComponent: load, ...options };
}
