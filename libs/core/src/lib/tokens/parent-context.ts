import { InjectionToken } from '@angular/core';
import { NgxFwParentContext } from '../types/parent-context.type';

/**
 * Token through which a child reads its enclosing group's state and
 * inheritable options. Provided by directives that act as form groups (e.g.
 * `NgxFbGroupDirective` in `@ngx-formbar/reactive-forms` provides itself).
 *
 * Inject with `{ optional: true, skipSelf: true }`: top-level entries have
 * no parent, and group directives must read the parent above their own
 * provided context.
 */
export const NGX_FW_PARENT_CONTEXT = new InjectionToken<NgxFwParentContext>(
  'NGX_FW_PARENT_CONTEXT',
);
