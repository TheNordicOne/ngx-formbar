import { Type } from '@angular/core';
import {
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
 * };
 * ```
 */
export function staticComponent(type: Type<unknown>): StaticRegistration {
  return { component: type };
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
 * };
 * ```
 */
export function loadComponent(load: LoadComponentFn): LazyRegistration {
  return { loadComponent: load };
}
