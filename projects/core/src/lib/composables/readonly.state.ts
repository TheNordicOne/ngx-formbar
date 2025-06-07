import { computed, inject, Signal } from '@angular/core';
import { NgxFwAbstractControl, NgxFwFormGroup } from '../types/content.type';
import { FormService } from '../services/form.service';
import { ExpressionService } from '../services/expression.service';
import { NgxfwGroupDirective } from '../directives/ngxfw-group.directive';
import { Program } from 'acorn';
import { FormContext } from '../types/expression.type';

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
export function withReadonlyState(content: Signal<NgxFwAbstractControl>) {
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
    if (
      typeof readonlyOption === 'boolean' ||
      typeof readonlyOption === 'function'
    ) {
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

  const readonlyFunction = computed(() => {
    const readonlyOption = content().readonly;
    if (typeof readonlyOption !== 'function') {
      return null;
    }
    return readonlyOption;
  });

  return computed<boolean>(() => {
    const readonlyStatic = readonlyBool();

    if (readonlyStatic !== null) {
      return readonlyStatic;
    }

    const reactiveFormValues = formService.formValue();
    const currentSynchronousFormValues = formService.formGroup
      .value as FormContext;
    const evaluationContext =
      reactiveFormValues ?? currentSynchronousFormValues;

    const readonlyFn = readonlyFunction();

    if (readonlyFn) {
      return readonlyFn(evaluationContext);
    }

    const ast = readonlyAst();
    if (!ast) {
      return parentGroupIsReadonly();
    }

    const readonly =
      expressionService.evaluateExpression(ast, evaluationContext) ?? false;
    return readonly as boolean;
  });
}
