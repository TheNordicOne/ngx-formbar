import {
  computed,
  Directive,
  effect,
  inject,
  input,
  OnDestroy,
  signal,
  Signal,
  untracked,
} from '@angular/core';
import {
  NgxFwControl,
  NgxFwFormGroup,
  ValueStrategy,
} from '../types/content.type';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
import { ValidatorRegistrationService } from '../services/validator-registration.service';
import { ExpressionService } from '../services/expression.service';
import { Program } from 'acorn';
import { FormService } from '../services/form.service';
import { NgxfwGroupDirective } from './ngxfw-group.directive';
import { StateHandling } from '../types/registration.type';

@Directive({
  selector: '[ngxfwControl]',
  host: {
    '[attr.hidden]': 'hiddenAttribute()',
  },
})
export class NgxfwControlDirective<T extends NgxFwControl>
  implements OnDestroy
{
  private parentContainer = inject(ControlContainer);
  private expressionService = inject(ExpressionService);
  private formService = inject(FormService);
  private validatorRegistrationService = inject(ValidatorRegistrationService);
  private validatorRegistrations =
    this.validatorRegistrationService.registrations;
  private readonly parentGroupDirective: NgxfwGroupDirective<NgxFwFormGroup> | null =
    inject(NgxfwGroupDirective<NgxFwFormGroup>, {
      optional: true,
    });

  private asyncValidatorRegistrations =
    this.validatorRegistrationService.asyncRegistrations;

  readonly content = input.required<T>();

  private readonly visibilityHandling = signal<StateHandling>('auto');
  private readonly disabledHandling = signal<StateHandling>('auto');
  private readonly controlInstance = computed(() => {
    const content = this.content();

    const validators = this.getValidators(content);
    const asyncValidators = this.getAsyncValidators(content);
    return new FormControl(content.defaultValue, {
      nonNullable: content.nonNullable,
      validators,
      asyncValidators,
    });
  });

  readonly testId = computed(() => this.content().id);
  readonly visibilityAst = computed<Program | null>(() =>
    this.expressionService.parseExpressionToAst(this.content().hidden),
  );
  readonly hideStrategy = computed(() => this.content().hideStrategy);
  readonly valueStrategy = computed(
    () => this.content().valueStrategy ?? this.parentValueStrategy(),
  );

  readonly disabledAst = computed<Program | null>(() => {
    const disabledOption = this.content().disabled;
    if (typeof disabledOption === 'boolean') {
      return null;
    }
    return this.expressionService.parseExpressionToAst(disabledOption);
  });

  readonly disabledBool = computed(() => {
    const disabledOption = this.content().disabled;
    if (typeof disabledOption !== 'boolean') {
      return null;
    }
    return disabledOption;
  });

  readonly readonlyAst = computed<Program | null>(() => {
    const readonlyOption = this.content().readonly;
    if (typeof readonlyOption === 'boolean') {
      return null;
    }
    return this.expressionService.parseExpressionToAst(readonlyOption);
  });

  readonly readonlyBool = computed(() => {
    const readonlyOption = this.content().readonly;
    if (typeof readonlyOption !== 'boolean') {
      return null;
    }
    return readonlyOption;
  });

  readonly parentGroupIsHidden: Signal<unknown> = computed<unknown>(() => {
    const parentGroup = this.parentGroupDirective;
    if (!parentGroup) {
      return false;
    }

    return parentGroup.isHidden();
  });

  readonly parentValueStrategy = computed(() =>
    this.parentGroupDirective?.valueStrategy(),
  );

  readonly isHidden = computed<unknown>(() => {
    const value = this.formService.formValue();
    const ast = this.visibilityAst();
    if (!ast) {
      return this.parentGroupIsHidden();
    }

    const isHidden: unknown =
      this.expressionService.evaluateExpression(ast, value) ?? false;
    return isHidden || this.parentGroupIsHidden();
  });

  readonly hiddenAttribute = computed(() => {
    const isHidden = this.isHidden();
    const visibilityHandling = this.visibilityHandling();
    if (visibilityHandling !== 'auto') {
      return null;
    }
    return isHidden ? true : null;
  });

  readonly disabled = computed<boolean>(() => {
    const disabledBool = this.disabledBool();

    if (disabledBool !== null) {
      return disabledBool;
    }

    const value = this.formService.formValue();
    const ast = this.disabledAst();
    if (!ast) {
      return this.parentGroupIsDisabled();
    }

    const disabled =
      this.expressionService.evaluateExpression(ast, value) ?? false;
    return disabled as boolean;
  });

  readonly parentGroupIsDisabled: Signal<boolean> = computed<boolean>(() => {
    const parentGroup = this.parentGroupDirective;
    if (!parentGroup) {
      return false;
    }

    return parentGroup.disabled();
  });

  readonly readonly = computed<boolean>(() => {
    const readonlyBool = this.readonlyBool();

    if (readonlyBool !== null) {
      return readonlyBool;
    }

    const value = this.formService.formValue();
    const ast = this.readonlyAst();
    if (!ast) {
      return this.parentGroupIsReadonly();
    }

    const readonly =
      this.expressionService.evaluateExpression(ast, value) ?? false;
    return readonly as boolean;
  });

  readonly parentGroupIsReadonly: Signal<boolean> = computed<boolean>(() => {
    const parentGroup = this.parentGroupDirective;
    if (!parentGroup) {
      return false;
    }

    return parentGroup.readonly();
  });

  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  get formControl() {
    const id = this.content().id;
    if (!this.parentFormGroup?.contains(id)) {
      return null;
    }

    return this.parentFormGroup.get(id) as FormControl | null;
  }

  constructor() {
    effect(() => {
      this.controlInstance();
      const isHidden = this.isHidden();
      const hideStrategy = this.hideStrategy();
      const valueStrategy = this.valueStrategy();
      const formControl = untracked(() => this.formControl);

      // Re-attach control
      if (!formControl && !isHidden) {
        untracked(() => {
          this.setControl();
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
          this.removeControl();
        });
      }

      // Only thing left to check is value strategy
      untracked(() => {
        this.handleValue(valueStrategy);
      });
    });

    effect(() => {
      const disabled = this.disabled();
      const disabledHandling = this.disabledHandling();

      if (disabledHandling === 'manual') {
        return;
      }

      if (!disabled) {
        untracked(() => {
          this.enableControl();
        });
        return;
      }
      untracked(() => {
        this.disableControl();
      });
    });
  }

  setVisibilityHandling(visibilityHandling: StateHandling) {
    this.visibilityHandling.set(visibilityHandling);
  }

  setDisabledHandling(disabledHandling: StateHandling) {
    this.disabledHandling.set(disabledHandling);
  }

  private getValidators(content: T) {
    const validatorKeys = content.validators ?? [];
    return validatorKeys.flatMap(
      (key) => this.validatorRegistrations().get(key) ?? [],
    );
  }

  private getAsyncValidators(content: T) {
    const validatorKeys = content.asyncValidators ?? [];
    return validatorKeys.flatMap(
      (key) => this.asyncValidatorRegistrations().get(key) ?? [],
    );
  }

  private setControl() {
    this.parentFormGroup?.setControl(
      this.content().id,
      this.controlInstance(),
      {
        emitEvent: false,
      },
    );
  }

  private removeControl() {
    const id = this.content().id;
    const formControl = this.formControl;
    // Check if control exists immediately before attempting removal
    if (formControl) {
      this.parentFormGroup?.removeControl(id, { emitEvent: false });
    }
  }

  private enableControl() {
    const formControl = this.controlInstance();
    formControl.enable({ emitEvent: false });
  }
  private disableControl() {
    const formControl = this.controlInstance();

    formControl.disable({ emitEvent: false });
  }

  private handleValue(valueStrategy?: ValueStrategy) {
    switch (valueStrategy) {
      case 'last':
        break;
      case 'reset':
        this.controlInstance().reset(undefined, { emitEvent: false });
        break;
      default:
        this.controlInstance().setValue(this.content().defaultValue);
        break;
    }
  }

  ngOnDestroy(): void {
    this.removeControl();
  }
}
