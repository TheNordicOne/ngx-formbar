import { computed, effect, inject, Signal, untracked } from '@angular/core';
import {
  ExpressionService,
  FormContext,
  HideStrategy,
  NgxFbBaseContent,
  NgxFbContent,
  NgxFbFormGroup,
  resolveHiddenAttribute,
  resolveHiddenState,
  SimpleFunction,
  StateHandling,
  ValueHandleFunction,
  ValueStrategy,
} from '@ngx-formbar/core';
import { FormService } from '../services/form.service';
import { AbstractControl, ControlContainer, FormGroup } from '@angular/forms';
import { NgxfbGroupDirective } from '../directives/ngxfb-group.directive';

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
export function withHiddenState(content: Signal<NgxFbBaseContent>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);
  const parentGroupDirective: NgxfbGroupDirective<NgxFbFormGroup> | null =
    inject(NgxfbGroupDirective<NgxFbFormGroup>, {
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

  const option = computed(() => content().hidden);

  const formContext = computed<FormContext>(
    () =>
      formService.formValue() ?? (formService.formGroup.value as FormContext),
  );

  return resolveHiddenState(option, formContext, expressionService, parentGroupIsHidden);
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
 * @param options.name Signal containing the name of the control
 * @param options.controlInstance Signal with the form control instance
 * @param options.hiddenSignal Signal that indicates if the control should be hidden
 * @param options.hideStrategySignal Signal with the strategy for handling hidden controls
 * @param options.valueStrategySignal Signal with the strategy for handling control values
 * @param options.parentValueStrategySignal Signal with the parent's value strategy
 * @param options.attachFunction Function to call when control should be attached
 * @param options.detachFunction Function to call when control should be detached
 * @param options.valueHandleFunction Function to handle control value based on strategy
 */
export function withHiddenAttribute(options: {
  hiddenSignal: Signal<boolean>;
  hiddenHandlingSignal: Signal<StateHandling>;
}) {
  return resolveHiddenAttribute(options);
}

export function hiddenEffect(options: {
  content: Signal<NgxFbContent>;
  name: Signal<string>;
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
    const formControl = untracked(() => parentFormGroup?.get(options.name()));

    // Re-attach control
    // On initial render the form control will not be attached, but we need it for the hide strategy "keep"
    if (!formControl && (!isHidden || hideStrategy === 'keep')) {
      untracked(() => {
        options.attachFunction();
      });
      return;
    }

    // Control is already detached
    if (hideStrategy === 'remove' && !formControl) {
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
