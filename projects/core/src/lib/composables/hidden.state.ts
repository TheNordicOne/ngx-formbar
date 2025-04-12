import { computed, effect, inject, Signal, untracked } from '@angular/core';
import {
  HideStrategy,
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

export function withHiddenState(content: Signal<NgxFwContent>) {
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

  const visibilityAst = computed<Program | null>(() =>
    expressionService.parseExpressionToAst(content().hidden),
  );

  return computed<boolean>(() => {
    const value = formService.formValue();
    const ast = visibilityAst();
    if (!ast) {
      return parentGroupIsHidden();
    }

    const isHidden: boolean =
      (expressionService.evaluateExpression(ast, value) as
        | boolean
        | undefined) ?? false;
    return isHidden || parentGroupIsHidden();
  });
}

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
