import { InjectionToken, Signal } from '@angular/core';
import { FormContext } from '../types/expression.type';

/**
 * Per-form provider for the current form value as a signal. Composables that
 * evaluate expressions against the form value inject this token instead of a
 * concrete form-integration service. An integration package (e.g.
 * `@ngx-formbar/reactive-forms`) provides this at the root form scope from
 * its own form-state source.
 */
export const NGX_FW_FORM_VALUE = new InjectionToken<Signal<FormContext>>(
  'NGX_FW_FORM_VALUE',
);
