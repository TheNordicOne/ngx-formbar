import { computed, inject, Signal } from '@angular/core';
import { NgxFbAbstractControl } from '../types/content.type';
import { ExpressionService } from '../services/expression';
import { NGX_FW_FORM_VALUE } from '../tokens/form-value';
import { NGX_FW_PARENT_CONTEXT } from '../tokens/parent-context';
import { resolveInheritableExpression } from './resolve-inheritable-expression';

/**
 * Computes the reactive readonly state for a control. Inheritance from the
 * parent group means a child is automatically readonly when its enclosing
 * group is, unless the child explicitly overrides the value.
 *
 * Resolution order:
 * 1. `content.readonly` boolean is used as-is.
 * 2. Expression string is evaluated against current form values.
 * 3. Otherwise, inherits from the parent group via {@link NGX_FW_PARENT_CONTEXT}.
 *
 * @param content Signal of the control's content config. The `readonly`
 *   field may be a boolean, expression string, or expression function.
 * @returns A signal of the resolved boolean readonly state.
 */
export function withReadonlyState(content: Signal<NgxFbAbstractControl>) {
  const formValue = inject(NGX_FW_FORM_VALUE);
  const expressionService = inject(ExpressionService);
  const parent = inject(NGX_FW_PARENT_CONTEXT, {
    optional: true,
    skipSelf: true,
  });

  const parentIsReadonly = computed<boolean>(() =>
    parent ? parent.isReadonly() : false,
  );

  const option = computed(() => content().readonly);

  return resolveInheritableExpression(
    option,
    formValue,
    expressionService,
    parentIsReadonly,
  );
}
