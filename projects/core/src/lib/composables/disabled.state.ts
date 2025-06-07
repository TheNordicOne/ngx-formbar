import { computed, effect, inject, Signal, untracked } from '@angular/core';
import { Program } from 'acorn';
import { NgxFwAbstractControl, NgxFwFormGroup } from '../types/content.type';
import { ExpressionService } from '../services/expression.service';
import { NgxfwGroupDirective } from '../directives/ngxfw-group.directive';
import { FormService } from '../services/form.service';
import { StateHandling } from '../types/registration.type';
import { SimpleFunction } from '../types/functions.type';
import { FormContext } from '../types/expression.type';

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
export function withDisabledState(content: Signal<NgxFwAbstractControl>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);
  const parentGroupDirective: NgxfwGroupDirective<NgxFwFormGroup> | null =
    inject(NgxfwGroupDirective<NgxFwFormGroup>, {
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

  const disabledAst = computed<Program | null>(() => {
    const disabledOption = content().disabled;
    if (typeof disabledOption !== 'string') {
      return null;
    }
    return expressionService.parseExpressionToAst(disabledOption);
  });

  const disabledBool = computed(() => {
    const disabledOption = content().disabled;
    if (typeof disabledOption !== 'boolean') {
      return null;
    }
    return disabledOption;
  });

  const disabledFunction = computed(() => {
    const disabledOption = content().disabled;
    if (typeof disabledOption !== 'function') {
      return null;
    }
    return disabledOption;
  });

  return computed<boolean>(() => {
    const disabledStatic = disabledBool();

    if (disabledStatic !== null) {
      return disabledStatic;
    }

    const reactiveFormValues = formService.formValue();
    const currentSynchronousFormValues = formService.formGroup
      .value as FormContext;
    const evaluationContext =
      reactiveFormValues ?? currentSynchronousFormValues;

    const disableFn = disabledFunction();
    if (disableFn) {
      return disableFn(evaluationContext);
    }

    const ast = disabledAst();
    if (!ast) {
      return parentGroupIsDisabled();
    }

    const disabled =
      expressionService.evaluateExpression(ast, evaluationContext) ?? false;
    return disabled as boolean;
  });
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
export function disabledEffect(options: {
  disabledSignal: Signal<boolean>;
  disabledHandlingSignal: Signal<StateHandling>;
  enableFunction: SimpleFunction;
  disableFunction: SimpleFunction;
}) {
  effect(() => {
    const disabled = options.disabledSignal();
    const disabledHandling = options.disabledHandlingSignal();

    if (disabledHandling === 'manual') {
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
