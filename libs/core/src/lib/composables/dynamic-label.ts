import { computed, inject, Signal } from '@angular/core';
import { NgxFbControl } from '../types/content.type';
import { ExpressionService } from '../services/expression';
import { NGX_FW_FORM_VALUE } from '../tokens/form-value';
import { resolveExpression } from './resolve-expression';

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
  const formValue = inject(NGX_FW_FORM_VALUE);
  const expressionService = inject(ExpressionService);

  return resolveExpression<string>(
    computed(() => content().dynamicLabel),
    formValue,
    expressionService,
  );
}
