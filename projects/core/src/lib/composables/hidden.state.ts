import { computed, effect, inject, Signal, untracked } from '@angular/core';
import {
  HideStrategy,
  NgxFwBaseContent,
  NgxFwContent,
  NgxFwFormGroup,
  ValueStrategy,
} from '../types/content.type';
import { ExpressionService } from '../services/expression.service';
import { NgxfwGroupDirective } from '../directives/ngxfw-group.directive';
import { FormService } from '../services/form.service';
import { StateHandling } from '../types/registration.type';
import { SimpleFunction, ValueHandleFunction } from '../types/functions.type';
import { Program } from 'acorn';
import { AbstractControl, ControlContainer, FormGroup } from '@angular/forms';
import { FormContext } from '../types/expression.type';

/**
 * Computes a reactive hidden state based on control content
 *
 * The hidden state is determined using the following priority:
 * 1. If content.hidden is an expression string, it's parsed to AST and evaluated
 *    against the current form values
 * 2. If no hidden expression is defined, the control inherits the hidden state
 *    from its parent group
 * 3. Both conditions can be combined - a control is hidden if either its own
 *    condition evaluates to true OR its parent group is hidden
 *
 * @param content Signal containing control configuration with potential hidden expression
 * @returns Computed signal that resolves to boolean hidden state
 */
export function withHiddenState(content: Signal<NgxFwBaseContent>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);
  const parentGroupDirective: NgxfwGroupDirective<NgxFwFormGroup> | null =
    inject(NgxfwGroupDirective<NgxFwFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  const parentGroupIsHidden: Signal<boolean> = computed<boolean>(() => {
    const parentGroup = parentGroupDirective;
    if (!parentGroup) {
      return false;
    }

    return parentGroup.isHidden();
  });

  const visibilityAst = computed<Program | null>(() => {
    const hiddenOption = content().hidden;
    if (typeof hiddenOption !== 'string') {
      return null;
    }
    return expressionService.parseExpressionToAst(hiddenOption);
  });

  const visibilityFunction = computed(() => {
    const visibilityOption = content().hidden;
    if (typeof visibilityOption !== 'function') {
      return null;
    }
    return visibilityOption;
  });

  return computed<boolean>(() => {
    const reactiveFormValues = formService.formValue();
    const currentSynchronousFormValues = formService.formGroup
      .value as FormContext;
    const evaluationContext =
      reactiveFormValues ?? currentSynchronousFormValues;

    const visibilityFn = visibilityFunction();

    if (visibilityFn) {
      return visibilityFn(evaluationContext);
    }

    const ast = visibilityAst();
    if (!ast) {
      return parentGroupIsHidden();
    }

    const isHidden: boolean =
      (expressionService.evaluateExpression(ast, evaluationContext) as
        | boolean
        | undefined) ?? false;
    return isHidden || parentGroupIsHidden();
  });
}

/**
 * Creates a computed attribute value for hidden DOM elements
 *
 * When visibilityHandling is set to 'auto', this returns a boolean attribute value
 * that can be used with Angular's [attr.hidden] binding. When set to 'manual',
 * it returns null so the attribute is not applied.
 *
 * @param options Configuration object for hidden attribute
 * @param options.hiddenSignal Signal that indicates if the control should be hidden
 * @param options.hiddenHandlingSignal Signal that determines how visibility is managed
 * @returns Computed signal that resolves to attribute value (true or null)
 */
export function withHiddenAttribute(options: {
  hiddenSignal: Signal<boolean>;
  hiddenHandlingSignal: Signal<StateHandling>;
}) {
  return computed(() => {
    const isHidden = options.hiddenSignal();
    const visibilityHandling = options.hiddenHandlingSignal();
    if (visibilityHandling !== 'auto') {
      return null;
    }
    return isHidden ? true : null;
  });
}

/**
 * Creates an effect that manages control visibility in forms
 *
 * Based on visibility state and hide strategy, this effect:
 * 1. Attaches the control to the form when visible
 * 2. Detaches the control from the form when hidden and strategy is 'remove'
 * 3. Manages control values based on the specified valueStrategy when visibility changes
 *
 * @param options Configuration object for hidden effect
 * @param options.content Signal containing control configuration
 * @param options.controlInstance Signal with the form control instance
 * @param options.hiddenSignal Signal that indicates if the control should be hidden
 * @param options.hideStrategySignal Signal with the strategy for handling hidden controls
 * @param options.valueStrategySignal Signal with the strategy for handling control values
 * @param options.parentValueStrategySignal Signal with the parent's value strategy
 * @param options.attachFunction Function to call when control should be attached
 * @param options.detachFunction Function to call when control should be detached
 * @param options.valueHandleFunction Function to handle control value based on strategy
 */
export function hiddenEffect(options: {
  content: Signal<NgxFwContent>;
  controlInstance: Signal<AbstractControl>;
  hiddenSignal: Signal<boolean>;
  hideStrategySignal: Signal<HideStrategy | undefined>;
  valueStrategySignal: Signal<ValueStrategy | undefined>;
  parentValueStrategySignal: Signal<ValueStrategy | undefined>;
  attachFunction: SimpleFunction;
  detachFunction: SimpleFunction;
  valueHandleFunction: ValueHandleFunction;
}) {
  const parentContainer = inject(ControlContainer);
  const parentFormGroup = parentContainer.control as FormGroup | null;
  effect(() => {
    options.controlInstance();
    const isHidden = options.hiddenSignal();
    const hideStrategy = options.hideStrategySignal();
    const valueStrategy =
      options.valueStrategySignal() ?? options.parentValueStrategySignal();
    const formGroup = untracked(() =>
      parentFormGroup?.get(options.content().id),
    );

    // Re-attach control
    if (!formGroup && !isHidden) {
      untracked(() => {
        options.attachFunction();
      });
      return;
    }

    // Control is already detached
    if (hideStrategy === 'remove' && !formGroup) {
      return;
    }

    // Remove control
    if (hideStrategy === 'remove' && isHidden) {
      untracked(() => {
        options.detachFunction();
      });
    }

    // Only thing left to check is value strategy
    untracked(() => {
      options.valueHandleFunction(valueStrategy);
    });
  });
}
