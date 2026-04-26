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
 * Computes a reactive disabled state based on control content
 *
 * The disabled state is determined using the following priority:
 * 1. If content.disabled is a boolean, that value is used directly
 * 2. If content.disabled is an expression string, it's parsed to AST and evaluated
 *    against the current form values
 * 3. If no disabled property is defined, the control inherits the disabled state
 *    from its parent group
 *
 * This hierarchical inheritance ensures that child controls are automatically
 * disabled when their parent group is disabled, unless explicitly overridden.
 *
 * @param content Signal containing control configuration with potential disabled property
 * @returns Computed signal that resolves to boolean disabled state
 */
export function withDisabledState(content: Signal<NgxFbAbstractControl>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);
  const parentGroupDirective: NgxfbLegacyGroupDirective<NgxFbFormGroup> | null =
    inject(NgxfbLegacyGroupDirective<NgxFbFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  const parentGroupIsDisabled: Signal<boolean> = computed<boolean>(() => {
    const parentGroup = parentGroupDirective;
    if (!parentGroup) {
      return false;
    }

    return parentGroup.disabled();
  });

  const option = computed(() => content().disabled);

  const formContext = computed<FormContext>(() => formService.formValue());

  return resolveInheritableExpression(
    option,
    formContext,
    expressionService,
    parentGroupIsDisabled,
  );
}

/**
 * Creates an effect that manages control/group disabled state
 *
 * @param options Configuration object for disabled effect
 * @param options.disabledSignal Signal that indicates if the component should be disabled
 * @param options.disabledHandlingSignal Signal that determines how disabled state changes should be handled
 * @param options.enableFunction Function to call when component should be enabled
 * @param options.disableFunction Function to call when component should be disabled
 */
export { resolveDisabledEffect as disabledEffect } from '@ngx-formbar/core';
