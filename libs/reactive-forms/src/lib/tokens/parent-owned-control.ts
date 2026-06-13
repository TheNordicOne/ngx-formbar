import { InjectionToken } from '@angular/core';

/**
 * `true` throughout the rendered subtree of a `FormArray`. Each row's controls
 * are built ahead of render by {@link RowFactoryService} and held by the
 * `FormArray`, so the row-rendering directives must not run their normal
 * create-and-self-register path. Where this is `true` they reuse the control
 * the parent already holds instead of building and registering their own.
 *
 * Provided by {@link NgxFbArrayDirective} over the array's subtree; absent
 * (read as `false`) for any directive used outside an array.
 */
export const NGXFB_PARENT_OWNED_CONTROL = new InjectionToken<boolean>(
  'ngxfb-parent-owned-control',
);
