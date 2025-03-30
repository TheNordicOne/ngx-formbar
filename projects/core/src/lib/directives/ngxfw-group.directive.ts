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
import { NgxFwFormGroup, ValueStrategy } from '../types/content.type';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
import { ComponentRegistrationService } from '../services/component-registration.service';
import { ValidatorRegistrationService } from '../services/validator-registration.service';
import { Program } from 'acorn';
import { ExpressionService } from '../services/expression.service';
import { FormService } from '../services/form.service';
import { VisibilityHandling } from '../types/registration.type';

@Directive({
  selector: '[ngxfwGroup]',
  host: {
    '[attr.hidden]': 'hiddenAttribute()',
  },
})
export class NgxfwGroupDirective<T extends NgxFwFormGroup>
  implements OnDestroy
{
  private parentContainer = inject(ControlContainer);
  private expressionService = inject(ExpressionService);
  private formService = inject(FormService);
  private readonly contentRegistrationService = inject(
    ComponentRegistrationService,
  );

  private validatorRegistrationService = inject(ValidatorRegistrationService);
  private validatorRegistrations =
    this.validatorRegistrationService.registrations;

  private asyncValidatorRegistrations =
    this.validatorRegistrationService.asyncRegistrations;

  private readonly parentGroupDirective: NgxfwGroupDirective<NgxFwFormGroup> | null =
    inject(NgxfwGroupDirective<NgxFwFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  readonly content = input.required<T>();

  private readonly visibilityHandling = signal<VisibilityHandling>('auto');
  readonly testId = computed(() => this.content().id);
  readonly title = computed(() => this.content().title);
  readonly controls = computed(() => this.content().controls);
  readonly registrations = this.contentRegistrationService.registrations;

  readonly visibilityAst = computed<Program | null>(() =>
    this.expressionService.parseExpressionToAst(this.content().hide),
  );

  readonly hideStrategy = computed(() => this.content().hideStrategy);
  readonly valueStrategy: Signal<ValueStrategy | undefined> = computed(
    () => this.content().valueStrategy ?? this.parentValueStrategy(),
  );

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

  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  get formGroup() {
    return this.parentFormGroup?.get(this.content().id) as FormControl | null;
  }

  setVisibilityHandling(visibilityHandling: VisibilityHandling) {
    this.visibilityHandling.set(visibilityHandling);
  }

  private readonly groupInstance = computed(() => {
    const content = this.content();

    const validators = this.getValidators(content);
    const asyncValidators = this.getAsyncValidators(content);

    return new FormGroup([], validators, asyncValidators);
  });

  constructor() {
    effect(() => {
      this.groupInstance();
      const isHidden = this.isHidden();
      const hideStrategy = this.hideStrategy();
      const valueStrategy = this.valueStrategy() ?? this.parentValueStrategy();
      const formGroup = untracked(() => this.formGroup);

      // Re-attach control
      if (!formGroup && !isHidden) {
        untracked(() => {
          this.setGroup();
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
          this.removeGroup();
        });
      }

      // Only thing left to check is value strategy
      untracked(() => {
        this.handleValue(valueStrategy);
      });
    });
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

  private setGroup() {
    this.parentFormGroup?.setControl(this.content().id, this.groupInstance(), {
      emitEvent: false,
    });
  }

  private removeGroup() {
    const id = this.content().id;
    const formGroup = this.formGroup;
    // Check if control exists immediately before attempting removal
    if (formGroup) {
      this.parentFormGroup?.removeControl(id, { emitEvent: false });
    }
  }

  private handleValue(valueStrategy?: ValueStrategy) {
    switch (valueStrategy) {
      case 'last':
        break;
      case 'default':
        break;
      default:
        // Instead of resetting  the group, we need to reset the controls individually
        // to allow them to overwrite the value strategy
        // If a control doesn't have a value strategy, we reset it
        this.content().controls.forEach((control) => {
          if (control.valueStrategy) {
            return;
          }
          const formControl = this.formGroup?.get(control.id);
          if (formControl) {
            formControl.reset(undefined, { emitEvent: false });
          }
        });
        break;
    }
  }

  ngOnDestroy(): void {
    this.removeGroup();
  }
}
