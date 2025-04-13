import {
  computed,
  Directive,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import {
  NgxFwControl,
  NgxFwFormGroup,
  ValueStrategy,
} from '../types/content.type';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
import { NgxfwGroupDirective } from './ngxfw-group.directive';
import { StateHandling } from '../types/registration.type';
import {
  disabledEffect,
  withDisabledState,
} from '../composables/disabled.state';
import { withReadonlyState } from '../composables/readonly.state';
import {
  hiddenEffect,
  withHiddenAttribute,
  withHiddenState,
} from '../composables/hidden.state';
import { withAsyncValidators, withValidators } from '../composables/validators';
import { withTestId } from '../composables/testId';
import { withUpdateStrategy } from '../composables/update-strategy';

/**
 * Control Directive for Ngx Formwork
 *
 * This directive manages form controls within Ngx Formwork, handling:
 * - Control registration with parent form groups
 * - Visibility states and DOM representation
 * - Disabled states with inheritance from parent groups
 * - Readonly states with inheritance from parent groups
 * - Validation setup and registration
 * - Value management based on configured strategies
 *
 * The directive automatically:
 * - Creates and registers form controls with the parent form group
 * - Evaluates conditions for hidden/disabled/readonly states
 * - Manages the control lifecycle based on visibility
 * - Applies validators to the control
 * - Handles control values according to the specified strategy when visibility changes
 *
 * @template T Type extending NgxFwControl containing control configuration
 */
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

  private readonly parentGroupDirective: NgxfwGroupDirective<NgxFwFormGroup> | null =
    inject(NgxfwGroupDirective<NgxFwFormGroup>, {
      optional: true,
    });

  /**
   * Required input containing the control configuration
   * Defines properties like ID, default value, validation, and state expressions
   */
  readonly content = input.required<T>();

  private readonly visibilityHandling = signal<StateHandling>('auto');
  private readonly disabledHandling = signal<StateHandling>('auto');

  /**
   * Computed test ID derived from the control's ID
   * Used for automated testing identification
   */
  readonly testId = withTestId(this.content);

  /**
   * Computed signal for the control's hide strategy
   * Determines how the control behaves when hidden (keep or remove from form)
   */
  readonly hideStrategy = computed(() => this.content().hideStrategy);

  /**
   * Computed signal for the control's value strategy
   * Determines how the control's value is managed when visibility changes
   */
  readonly valueStrategy = computed(
    () => this.content().valueStrategy ?? this.parentValueStrategy(),
  );

  /**
   * Computed signal for the parent's value strategy
   * Used when control doesn't define its own strategy
   */
  readonly parentValueStrategy = computed(() =>
    this.parentGroupDirective?.valueStrategy(),
  );

  /**
   * Computed signal for the hidden state
   * True when the control should be hidden
   */
  readonly isHidden = withHiddenState(this.content);

  /**
   * Computed signal for the hidden attribute
   * Used in DOM binding to show/hide the control element
   */
  readonly hiddenAttribute = withHiddenAttribute({
    hiddenSignal: this.isHidden,
    hiddenHandlingSignal: this.visibilityHandling,
  });

  /**
   * Computed signal for the disabled state
   * True when the control should be disabled
   */
  readonly disabled = withDisabledState(this.content);

  /**
   * Computed signal for the readonly state
   * True when the control should be readonly
   */
  readonly readonly = withReadonlyState(this.content);

  readonly updateStrategy = withUpdateStrategy(this.content);

  /**
   * Computed signal for the validators
   * Contains validator functions derived from configuration keys
   */
  private readonly validators = withValidators(this.content);

  /**
   * Computed signal for the async validators
   * Contains async validator functions derived from configuration keys
   */
  private readonly asyncValidators = withAsyncValidators(this.content);

  private readonly controlInstance = computed(() => {
    const content = this.content();

    const validators = this.validators();
    const asyncValidators = this.asyncValidators();
    const updateOn = this.updateStrategy();
    return new FormControl(content.defaultValue, {
      nonNullable: content.nonNullable,
      validators,
      asyncValidators,
      updateOn,
    });
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
    hiddenEffect({
      content: this.content,
      controlInstance: this.controlInstance,
      hiddenSignal: this.isHidden,
      hideStrategySignal: this.hideStrategy,
      valueStrategySignal: this.valueStrategy,
      parentValueStrategySignal: this.parentValueStrategy,
      attachFunction: this.setControl.bind(this),
      detachFunction: this.removeControl.bind(this),
      valueHandleFunction: this.handleValue.bind(this),
    });

    disabledEffect({
      disabledSignal: this.disabled,
      disabledHandlingSignal: this.disabledHandling,
      enableFunction: this.enableControl.bind(this),
      disableFunction: this.disableControl.bind(this),
    });
  }

  /**
   * Sets the visibility handling strategy
   * Determines if visibility should be managed by the component (manual) or by Formwork (auto)
   *
   * @param visibilityHandling Strategy for handling visibility ('auto' or 'manual')
   */
  setVisibilityHandling(visibilityHandling: StateHandling) {
    this.visibilityHandling.set(visibilityHandling);
  }

  /**
   * Sets the disabled handling strategy
   * Determines if disabled state should be managed by the component (manual) or by Formwork (auto)
   *
   * @param disabledHandling Strategy for handling disabled state ('auto' or 'manual')
   */
  setDisabledHandling(disabledHandling: StateHandling) {
    this.disabledHandling.set(disabledHandling);
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
