import { computed, inject, Signal } from '@angular/core';
import { NgxFbControl, ExpressionService, resolveExpression } from '@ngx-formbar/core';
import { FormService } from '../services/form.service';

/**
 * Resolves the `dynamicLabel` expression on a control to a signal of the
 * evaluated string (or undefined when not configured).
 *
 * @param content Signal of the control's content config. The `dynamicLabel`
 *   field may be a literal string, expression string, or expression function.
 * @returns A signal of the evaluated label, or `undefined` when no
 *   `dynamicLabel` is configured. Bind alongside the static `label` and let
 *   the consuming component prefer the dynamic value when present.
 */
export function withDynamicLabel(content: Signal<NgxFbControl>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);

  return resolveExpression<string>(
    computed(() => content().dynamicLabel),
    formService.formValue,
    expressionService,
  );
}
