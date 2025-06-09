import {
  computed,
  Directive,
  inject,
  input,
  OnDestroy,
  signal,
  Signal,
} from '@angular/core';
import { NgxFwFormGroup, ValueStrategy } from '../types/content.type';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
import { ComponentRegistrationService } from '../services/component-registration.service';
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
import { withDynamicTitle } from '../composables/dynamic-title';
import { TestIdBuilderFn } from '../types/functions.type';

/**
 * Group Directive for Ngx Formwork
 *
 * This directive manages form groups within Ngx Formwork, handling:
 * - Group registration with parent form groups
 * - Visibility states and DOM representation
 * - Disabled states with inheritance from parent groups
 * - Readonly states with inheritance from parent groups
 * - Validation setup and registration
 * - Value management based on configured strategies
 *
 * The directive automatically:
 * - Creates and registers form groups with the parent form group
 * - Evaluates conditions for hidden/disabled/readonly states
 * - Manages the group lifecycle based on visibility
 * - Applies validators to the group
 * - Handles group values according to the specified strategy when visibility changes
 *
 * @template T Type extending NgxFwFormGroup containing group configuration
 */
@Directive({
  selector: '[ngxfwGroup]',
  host: {
    '[attr.hidden]': 'hiddenAttribute()',
  },
})
export class NgxfwGroupDirective<T extends NgxFwFormGroup>
  implements OnDestroy
{
  private readonly contentRegistrationService = inject(
    ComponentRegistrationService,
  );
  private parentContainer = inject(ControlContainer);

  private readonly parentGroupDirective: NgxfwGroupDirective<NgxFwFormGroup> | null =
    inject(NgxfwGroupDirective<NgxFwFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  /**
   * Required input containing the group configuration
   * Defines properties like ID, controls, validation, and state expressions
   */
  readonly content = input.required<T>();

  /**
   * Required input for the controls name
   */
  readonly name = input.required<string>();

  private readonly visibilityHandling = signal<StateHandling>('auto');
  private readonly disabledHandling = signal<StateHandling>('auto');
  private readonly testIdBuilder = signal<TestIdBuilderFn | undefined>(
    undefined,
  );

  /**
   * Computed test ID derived from the group's ID
   * Used for automated testing identification
   */
  readonly testId = withTestId(this.content, this.name, this.testIdBuilder);

  /**
   * Computed signal for the group's hide strategy
   * Determines how the group behaves when hidden (keep or remove from form)
   */
  readonly hideStrategy = computed(() => this.content().hideStrategy);

  /**
   * Computed signal for the group's value strategy
   * Determines how the group's value is managed when visibility changes
   */
  readonly valueStrategy: Signal<ValueStrategy | undefined> = computed(
    () => this.content().valueStrategy ?? this.parentValueStrategy(),
  );

  /**
   * Computed signal for the parent's value strategy
   * Used when group doesn't define its own strategy
   */
  readonly parentValueStrategy = computed(() =>
    this.parentGroupDirective?.valueStrategy(),
  );

  /**
   * Computed signal for the hidden state
   * True when the group should be hidden
   */
  readonly isHidden = withHiddenState(this.content);

  /**
   * Computed signal for the hidden attribute
   * Used in DOM binding to show/hide the group element
   */
  readonly hiddenAttribute = withHiddenAttribute({
    hiddenSignal: this.isHidden,
    hiddenHandlingSignal: this.visibilityHandling,
  });

  /**
   * Computed signal for the disabled state
   * True when the group should be disabled
   */
  readonly disabled = withDisabledState(this.content);

  /**
   * Computed signal for the readonly state
   * True when the group should be readonly
   */
  readonly readonly = withReadonlyState(this.content);

  readonly updateStrategy = withUpdateStrategy(this.content);

  /**
   * Computed signal for the dynamic title
   */
  readonly dynamicTitle = withDynamicTitle(this.content);

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

  private readonly groupInstance = computed(() => {
    const validators = this.validators();
    const asyncValidators = this.asyncValidators();
    const updateOn = this.updateStrategy();
    return new FormGroup(
      {},
      {
        validators,
        asyncValidators,
        updateOn,
      },
    );
  });

  readonly registrations = this.contentRegistrationService.registrations;

  /**
   * Computed signal for the title of the group
   */
  readonly title = computed(() => this.content().title);

  /**
   * Computed signal for the child controls of the group
   */
  readonly controls = computed(() => Object.entries(this.content().controls));

  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  get formGroup() {
    return this.parentFormGroup?.get(this.name()) as FormControl | null;
  }

  constructor() {
    hiddenEffect({
      content: this.content,
      name: this.name,
      controlInstance: this.groupInstance,
      hiddenSignal: this.isHidden,
      hideStrategySignal: this.hideStrategy,
      valueStrategySignal: this.valueStrategy,
      parentValueStrategySignal: this.parentValueStrategy,
      attachFunction: this.setGroup.bind(this),
      detachFunction: this.removeGroup.bind(this),
      valueHandleFunction: this.handleValue.bind(this),
    });

    disabledEffect({
      disabledSignal: this.disabled,
      disabledHandlingSignal: this.disabledHandling,
      enableFunction: this.enableGroup.bind(this),
      disableFunction: this.disableGroup.bind(this),
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

  /**
   * Sets the function to use for building a test id.
   *
   * @param builderFn Function that returns the test id
   */
  setTestIdBuilderFn(builderFn: TestIdBuilderFn | undefined) {
    this.testIdBuilder.set(builderFn);
  }

  private setGroup() {
    this.parentFormGroup?.setControl(this.name(), this.groupInstance(), {
      emitEvent: false,
    });
  }

  private removeGroup() {
    const id = this.name();
    const formGroup = this.formGroup;
    // Check if control exists immediately before attempting removal
    if (formGroup) {
      this.parentFormGroup?.removeControl(id, { emitEvent: false });
    }
  }

  private enableGroup() {
    const formGroup = this.groupInstance();

    formGroup.enable({ emitEvent: false });
  }
  private disableGroup() {
    const formGroup = this.groupInstance();

    formGroup.disable({ emitEvent: false });
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
        Object.entries(this.content().controls).forEach(([name, control]) => {
          if (!('valueStrategy' in control)) {
            return;
          }

          if (control.valueStrategy) {
            return;
          }
          const formControl = this.formGroup?.get(name);
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
