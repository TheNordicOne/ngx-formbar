import { Type } from '@angular/core';
import {
  ComponentRegistrationOptions,
  LazyRegistration,
  LoadComponentFn,
  StaticRegistration,
} from '../types/registration.type';

/**
 * Creates a static component registration entry for an eagerly imported component.
 *
 * @param type Component class to instantiate when the matching content type is
 *   resolved.
 * @param options Optional behavior flags such as `hiddenHandling` and
 *   `disabledHandling`. Defaults apply when omitted.
 * @returns Registration object suitable for use in a
 *   {@link ComponentRegistrationConfig}.
 *
 * @example
 * ```ts
 * import { staticComponent } from '@ngx-formbar/core';
 * import { TextComponent } from './text.component';
 *
 * const registrations = {
 *   text: staticComponent(TextComponent),
 *   custom: staticComponent(CustomComponent, { hiddenHandling: 'manual' }),
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
 * Creates a lazy component registration entry that is loaded on demand.
 *
 * @param load Loader that returns a promise resolving to the component class.
 *   Typically a dynamic `import()` so the component lands in its own chunk.
 * @param options Optional behavior flags such as `hiddenHandling` and
 *   `disabledHandling`. Defaults apply when omitted.
 * @returns Registration object suitable for use in a
 *   {@link ComponentRegistrationConfig}.
 *
 * @example
 * ```ts
 * import { loadComponent } from '@ngx-formbar/core';
 *
 * const registrations = {
 *   text: loadComponent(() => import('./text.component').then(m => m.TextComponent)),
 *   custom: loadComponent(
 *     () => import('./custom.component').then(m => m.CustomComponent),
 *     { hiddenHandling: 'manual' },
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
