import { InjectionToken } from '@angular/core';

/**
 * Marks the subtree of a single array row. When present (and `true`), the
 * row-rendering directives switch to bind mode: they adopt the existing
 * `AbstractControl` already held by the parent `FormArray` instead of
 * creating a new instance and self-registering it. Provided per row by
 * {@link NgxFbFormArrayOutlet}.
 */
export const NGXFB_BIND_MODE = new InjectionToken<boolean>('ngxfb-bind-mode');
