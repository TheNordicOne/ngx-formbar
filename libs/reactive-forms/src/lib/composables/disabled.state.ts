import { computed, effect, inject, Signal, untracked } from '@angular/core';
import {
  ExpressionService,
  NgxFbAbstractControl,
  NgxFbFormGroup,
  resolveInheritableExpression,
} from '@ngx-formbar/core';
import { AbstractControl } from '@angular/forms';
import { FormService } from '../services/form.service';
import { NgxFbGroupDirective } from '../directives/ngx-fb-group.directive';

/**
 * Computes the reactive disabled state for a control. Inheritance from the
 * parent group means a child is automatically disabled when its enclosing
 * group is, unless the child explicitly overrides the value.
 *
 * Resolution order:
 * 1. `content.disabled` boolean is used as-is.
 * 2. Expression string is evaluated against current form values.
 * 3. Otherwise, inherits from the parent group.
 *
 * @param content Signal of the control's content config. The `disabled`
 *   field may be a boolean, expression string, or expression function.
 * @returns A signal of the resolved boolean disabled state.
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

    return parentGroup.isDisabled();
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
 * Creates an effect that toggles the form instance's enabled/disabled state.
 * When `handleDisable` is true, calls `enable()` or `disable()` on the
 * resolved instance with `emitEvent: false`. When false, the effect is a
 * no-op and the component applies the state itself.
 *
 * @param options.disabledSignal Signal of the resolved disabled state.
 * @param options.handleDisableSignal Signal indicating whether the library
 *   should apply the state. Mirrors the registration's `disabledHandling`.
 * @param options.instance Signal of the `FormControl` or `FormGroup` to
 *   toggle. Read inside `untracked` so re-creating the instance does not
 *   re-run the effect on its own.
 */
export function disabledEffect(options: {
  disabledSignal: Signal<boolean>;
  handleDisableSignal: Signal<boolean>;
  instance: Signal<AbstractControl>;
}) {
  effect(() => {
    const disabled = options.disabledSignal();
    const handleDisable = options.handleDisableSignal();

    if (!handleDisable) {
      return;
    }

    untracked(() => {
      const control = options.instance();
      if (disabled) {
        control.disable({ emitEvent: false });
        return;
      }
      control.enable({ emitEvent: false });
    });
  });
}
