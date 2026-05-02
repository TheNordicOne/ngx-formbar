import { computed, inject, Signal } from '@angular/core';
import { NgxFbControl, ExpressionService, resolveExpression } from '@ngx-formbar/core';
import { FormService } from '../services/form.service';

/**
 * Computes a dynamic label for a form control based on expression evaluation
 *
 * @param content Signal containing control configuration with dynamicLabel property
 * @returns Computed signal that resolves to the evaluated dynamic label string or undefined
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
