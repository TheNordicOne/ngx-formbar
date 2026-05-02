import { computed, inject, Signal } from '@angular/core';
import {
  ExpressionService,
  NgxFbFormGroup,
  resolveExpression,
} from '@ngx-formbar/core';
import { FormService } from '../services/form.service';

/**
 * Computes a dynamic title for a form group based on expression evaluation
 *
 * @param content Signal containing group configuration with dynamicTitle property
 * @returns Computed signal that resolves to the evaluated dynamic title string or undefined
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
