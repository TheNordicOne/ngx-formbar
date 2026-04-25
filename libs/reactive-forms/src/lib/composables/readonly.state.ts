import { computed, inject, Signal } from '@angular/core';
import {
  ExpressionService,
  FormContext,
  NgxFbAbstractControl,
  NgxFbFormGroup,
  resolveInheritableExpression,
} from '@ngx-formbar/core';
import { FormService } from '../services/form.service';
import { NgxfbLegacyGroupDirective } from '../directives/ngxfb-legacy-group.directive';

/**
 * Computes a reactive readonly state based on control content
 *
 * The readonly state is determined using the following priority:
 * 1. If content.readonly is a boolean, that value is used directly
 * 2. If content.readonly is an expression string, it's parsed to AST and evaluated
 *    against the current form values
 * 3. If no readonly property is defined, the control inherits the readonly state
 *    from its parent group
 *
 * This hierarchical inheritance ensures that child controls are automatically
 * set to readonly when their parent group is readonly, unless explicitly overridden.
 *
 * @param content Signal containing control configuration with potential readonly property
 * @returns Computed signal that resolves to boolean readonly state
 */
export function withReadonlyState(content: Signal<NgxFbAbstractControl>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);
  const parentGroupDirective: NgxfbLegacyGroupDirective<NgxFbFormGroup> | null =
    inject(NgxfbLegacyGroupDirective<NgxFbFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  const parentGroupIsReadonly: Signal<boolean> = computed<boolean>(() => {
    const parentGroup = parentGroupDirective;
    if (!parentGroup) {
      return false;
    }

    return parentGroup.readonly();
  });

  const option = computed(() => content().readonly);

  const formContext = computed<FormContext>(
    () =>
      formService.formValue() ?? (formService.formGroup.value as FormContext),
  );

  return resolveInheritableExpression(
    option,
    formContext,
    expressionService,
    parentGroupIsReadonly,
  );
}
