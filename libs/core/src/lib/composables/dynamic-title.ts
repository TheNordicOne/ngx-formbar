import { computed, inject, Signal } from '@angular/core';
import { NgxFbFormGroup } from '../types/content.type';
import { ExpressionService } from '../services/expression.service';
import { NGX_FW_FORM_VALUE } from '../tokens/form-value';
import { resolveExpression } from './resolve-expression';

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
  const formValue = inject(NGX_FW_FORM_VALUE);
  const expressionService = inject(ExpressionService);

  return resolveExpression<string>(
    computed(() => content().dynamicTitle),
    formValue,
    expressionService,
  );
}
