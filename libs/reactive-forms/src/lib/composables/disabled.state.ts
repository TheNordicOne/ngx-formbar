import { computed, effect, inject, Signal, untracked } from '@angular/core';
import {
  ExpressionService,
  NgxFbAbstractControl,
  NgxFbFormGroup,
  resolveInheritableExpression,
  SimpleFunction,
} from '@ngx-formbar/core';
import { FormService } from '../services/form.service';
import { NgxFbGroupDirective } from '../directives/ngx-fb-group.directive';

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
  const parentGroupDirective: NgxFbGroupDirective<NgxFbFormGroup> | null =
    inject(NgxFbGroupDirective<NgxFbFormGroup>, {
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

  return resolveInheritableExpression(
    option,
    formService.formValue,
    expressionService,
    parentGroupIsDisabled,
  );
}

/**
 * Creates an effect that manages disabled state transitions.
 *
 * When `handleDisable` is true, calls the appropriate enable/disable function
 * based on the disabled signal. When false, the effect is a no-op and the
 * component is responsible for applying the disabled state itself.
 *
 * @param options.disabledSignal Signal indicating whether the component should be disabled
 * @param options.handleDisableSignal Signal indicating whether the library should apply the disabled state
 * @param options.enableFunction Function to call when the component should be enabled
 * @param options.disableFunction Function to call when the component should be disabled
 */
export function disabledEffect(options: {
  disabledSignal: Signal<boolean>;
  handleDisableSignal: Signal<boolean>;
  enableFunction: SimpleFunction;
  disableFunction: SimpleFunction;
}) {
  effect(() => {
    const disabled = options.disabledSignal();
    const handleDisable = options.handleDisableSignal();

    if (!handleDisable) {
      return;
    }

    if (!disabled) {
      untracked(() => {
        options.enableFunction();
      });
      return;
    }
    untracked(() => {
      options.disableFunction();
    });
  });
}
