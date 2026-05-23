import { computed, inject, Signal } from '@angular/core';
import { NgxFbAbstractControl } from '../types/content.type';
import { ExpressionService } from '../services/expression';
import { NGX_FW_FORM_VALUE } from '../tokens/form-value';
import { NGX_FW_PARENT_CONTEXT } from '../tokens/parent-context';
import { resolveInheritableExpression } from './resolve-inheritable-expression';

/**
 * Computes the reactive disabled state for a control. Inheritance from the
 * parent group means a child is automatically disabled when its enclosing
 * group is, unless the child explicitly overrides the value.
 *
 * Resolution order:
 * 1. `content.disabled` boolean is used as-is.
 * 2. Expression string is evaluated against current form values.
 * 3. Otherwise, inherits from the parent group via {@link NGX_FW_PARENT_CONTEXT}.
 *
 * @param content Signal of the control's content config. The `disabled`
 *   field may be a boolean, expression string, or expression function.
 * @returns A signal of the resolved boolean disabled state.
 */
export function withDisabledState(
  content: Signal<NgxFbAbstractControl>,
): Signal<boolean> {
  const formValue = inject(NGX_FW_FORM_VALUE);
  const expressionService = inject(ExpressionService);
  const parent = inject(NGX_FW_PARENT_CONTEXT, {
    optional: true,
    skipSelf: true,
  });

  const parentIsDisabled = computed<boolean>(() =>
    parent ? parent.isDisabled() : false,
  );

  const option = computed(() => content().disabled);

  return resolveInheritableExpression(
    option,
    formValue,
    expressionService,
    parentIsDisabled,
  );
}
