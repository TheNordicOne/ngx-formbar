import { computed, effect, inject, Signal, untracked } from '@angular/core';
import { Program } from 'acorn';
import { NgxFwContent, NgxFwFormGroup } from '../types/content.type';
import { ExpressionService } from '../services/expression.service';
import { NgxfwGroupDirective } from '../directives/ngxfw-group.directive';
import { FormService } from '../services/form.service';
import { StateHandling } from '../types/registration.type';
import { SimpleFunction } from '../types/functions.type';

export function withDisabledState(content: Signal<NgxFwContent>) {
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
    if (typeof disabledOption === 'boolean') {
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

  return computed<boolean>(() => {
    const disabledStatic = disabledBool();

    if (disabledStatic !== null) {
      return disabledStatic;
    }

    const value = formService.formValue();
    const ast = disabledAst();
    if (!ast) {
      return parentGroupIsDisabled();
    }

    const disabled = expressionService.evaluateExpression(ast, value) ?? false;
    return disabled as boolean;
  });
}

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
