import { computed, inject, Signal } from '@angular/core';
import {
  ExpressionService,
  NgxFbAbstractControl,
  NgxFbFormGroup,
  resolveInheritableExpression,
} from '@ngx-formbar/core';
import { FormService } from '../services/form.service';
import { NgxFbGroupDirective } from '../directives/ngx-fb-group.directive';

/**
 * Computes the reactive readonly state for a control. Inheritance from the
 * parent group means a child is automatically readonly when its enclosing
 * group is, unless the child explicitly overrides the value.
 *
 * Resolution order:
 * 1. `content.readonly` boolean is used as-is.
 * 2. Expression string is evaluated against current form values.
 * 3. Otherwise, inherits from the parent group.
 *
 * @param content Signal of the control's content config. The `readonly`
 *   field may be a boolean, expression string, or expression function.
 * @returns A signal of the resolved boolean readonly state.
 */
export function withReadonlyState(content: Signal<NgxFbAbstractControl>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);
  const parentGroupDirective: NgxFbGroupDirective<NgxFbFormGroup> | null =
    inject(NgxFbGroupDirective<NgxFbFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  const parentGroupIsReadonly: Signal<boolean> = computed<boolean>(() => {
    const parentGroup = parentGroupDirective;
    if (!parentGroup) {
      return false;
    }

    return parentGroup.isReadonly();
  });

  const option = computed(() => content().readonly);

  return resolveInheritableExpression(
    option,
    formService.formValue,
    expressionService,
    parentGroupIsReadonly,
  );
}
