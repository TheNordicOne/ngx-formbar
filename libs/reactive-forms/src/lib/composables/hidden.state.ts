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
  ValueHandleFunction,
  ValueStrategy,
} from '@ngx-formbar/core';
import { FormService } from '../services/form.service';
import { AbstractControl, ControlContainer, FormGroup } from '@angular/forms';
import { NgxfbLegacyGroupDirective } from '../directives/ngxfb-legacy-group.directive';

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
  const parentGroupDirective: NgxfbLegacyGroupDirective<NgxFbFormGroup> | null =
    inject(NgxfbLegacyGroupDirective<NgxFbFormGroup>, {
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

  return resolveHiddenState(
    option,
    formContext,
    expressionService,
    parentGroupIsHidden,
  );
}

/**
 * Creates an effect that manages control registration and value strategy for the `keep` hide strategy.
 *
 * For `keep` strategy:
 * 1. Attaches the control to the form when not yet registered
 * 2. Applies the value strategy when the control becomes hidden
 *
 * For `remove` strategy, this effect is a no-op — the structural directive
 * (`NgxfbAbstractControlDirective`) owns the component lifecycle by destroying
 * and recreating the component. Registration and value restoration are handled
 * by `ngOnDestroy` / `controlInstance` respectively.
 */
export function withHiddenAttribute(options: {
  hiddenSignal: Signal<boolean>;
  handleVisibility: Signal<boolean>;
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
  handleVisibility: Signal<boolean>;
  attachFunction: SimpleFunction;
  valueHandleFunction: ValueHandleFunction;
}) {
  const parentContainer = inject(ControlContainer);
  const parentFormGroup = parentContainer.control as FormGroup | null;
  effect(() => {
    options.controlInstance();
    const isHidden = options.hiddenSignal();
    const hideStrategy = options.hideStrategySignal();
    const handleVisibility = options.handleVisibility();
    const valueStrategy =
      options.valueStrategySignal() ?? options.parentValueStrategySignal();
    const formControl = untracked(() => parentFormGroup?.get(options.name()));

    // Attach control if not yet registered in the form model
    if (!formControl) {
      untracked(() => {
        options.attachFunction();
      });
      return;
    }

    // Only auto + keep handles value strategy when hidden.
    // Manual mode: component handles everything.
    // Remove mode: structural directive handles the lifecycle.
    if (!handleVisibility || hideStrategy === 'remove') {
      return;
    }

    // Keep strategy: handle value when hidden
    if (isHidden) {
      untracked(() => {
        options.valueHandleFunction(valueStrategy);
      });
    }
  });
}
