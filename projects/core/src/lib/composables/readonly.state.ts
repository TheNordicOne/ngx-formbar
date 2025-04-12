import { computed, inject, Signal } from '@angular/core';
import { NgxFwContent, NgxFwFormGroup } from '../types/content.type';
import { FormService } from '../services/form.service';
import { ExpressionService } from '../services/expression.service';
import { NgxfwGroupDirective } from '../directives/ngxfw-group.directive';
import { Program } from 'acorn';

export function withReadonlyState(content: Signal<NgxFwContent>) {
  const formService = inject(FormService);
  const expressionService = inject(ExpressionService);
  const parentGroupDirective: NgxfwGroupDirective<NgxFwFormGroup> | null =
    inject(NgxfwGroupDirective<NgxFwFormGroup>, {
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

  const readonlyAst = computed<Program | null>(() => {
    const readonlyOption = content().readonly;
    if (typeof readonlyOption === 'boolean') {
      return null;
    }
    return expressionService.parseExpressionToAst(readonlyOption);
  });

  const readonlyBool = computed(() => {
    const readonlyOption = content().readonly;
    if (typeof readonlyOption !== 'boolean') {
      return null;
    }
    return readonlyOption;
  });

  return computed<boolean>(() => {
    const readonlyStatic = readonlyBool();

    if (readonlyStatic !== null) {
      return readonlyStatic;
    }

    const value = formService.formValue();
    const ast = readonlyAst();
    if (!ast) {
      return parentGroupIsReadonly();
    }

    const readonly = expressionService.evaluateExpression(ast, value) ?? false;
    return readonly as boolean;
  });
}
