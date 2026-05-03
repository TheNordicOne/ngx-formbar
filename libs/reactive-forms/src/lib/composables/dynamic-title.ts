import { computed, inject, Signal } from '@angular/core';
import {
  ExpressionService,
  NgxFbFormGroup,
  resolveExpression,
} from '@ngx-formbar/core';
import { FormService } from '../services/form.service';

/**
 * Resolves the `dynamicTitle` expression on a group to a signal of the
 * evaluated string (or undefined when not configured).
 *
 * @param content Signal of the group's content config. The `dynamicTitle`
 *   field may be a literal string, expression string, or expression function.
 * @returns A signal of the evaluated title, or `undefined` when no
 *   `dynamicTitle` is configured. Bind alongside the static `title` and let
 *   the consuming component prefer the dynamic value when present.
 */
export function withDynamicTitle(content: Signal<NgxFbFormGroup>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);

  return resolveExpression<string>(
    computed(() => content().dynamicTitle),
    formService.formValue,
    expressionService,
  );
}
