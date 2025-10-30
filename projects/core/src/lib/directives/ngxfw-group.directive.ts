import {
  computed,
  Directive,
  inject,
  input,
  OnDestroy,
  signal,
  Signal,
} from '@angular/core';
import { NgxFbFormGroup, ValueStrategy } from '../types/content.type';
import { ControlContainer, FormControl, FormGroup } from '@angular/forms';
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
 * Core directive for creating form groups in ngx-formbar.
 *
 * This directive handles the integration between Angular's reactive forms and
 * ngx-formbar's declarative configuration for FormGroups. It manages:
 *
 * - Group registration and lifecycle within parent forms
 * - State management (hidden, disabled, readonly)
 * - Validation setup
 * - Test ID generation
 * - Dynamic title support
 * - Child control management
 *
 * Use this directive with hostDirectives in your custom group components:
 *
 * ```typescript
 * @Component({
 *   hostDirectives: [
 *     {
 *       directive: NgxfbGroupDirective,
 *       inputs: ['content', 'name'],
 *     }
 *   ],
 * })
 * export class GroupComponent {
 *   private readonly control = inject(NgxfbGroupDirective<Group>);
 *   readonly content = this.control.content;
 *   readonly controls = this.control.controls;
 * }
 * ```
 *
 * @template T Type of the group configuration, must extend NgxFbFormGroup
 */
@Directive({
  selector: '[ngxfbGroup]',
  host: {
    '[attr.hidden]': 'hiddenAttribute()',
  },
})
export class NgxfbGroupDirective<T extends NgxFbFormGroup>
  implements OnDestroy
{
  private parentContainer = inject(ControlContainer);

  private readonly parentGroupDirective: NgxfbGroupDirective<NgxFbFormGroup> | null =
    inject(NgxfbGroupDirective<NgxFbFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  /**
   * Required input containing the group configuration
   * Defines properties like type, controls, validation, and state expressions
   */
  readonly content = input.required<T>();

  /**
   * Required input for the group's name
   * Used as the key in the parent FormGroup
   */
  readonly name = input.required<string>();

  /**
   * Signal for managing the visibility handling strategy ('auto' or 'manual')
   * - 'auto': directive handles visibility via hidden attribute
   * - 'manual': component handles visibility in its own template
   */
  private readonly visibilityHandling = signal<StateHandling>('auto');

  /**
   * Signal for managing the disabled state handling strategy ('auto' or 'manual')
   * - 'auto': directive handles disabled state via FormGroup methods
   * - 'manual': component handles disabled state in its own template
   */
  private readonly disabledHandling = signal<StateHandling>('auto');

  /**
   * Signal for the test ID builder function
   * Used to customize how test IDs are generated
   */
  private readonly testIdBuilder = signal<TestIdBuilderFn | undefined>(
    undefined,
  );

  /**
   * Computed test ID derived from the group's name
   * Used for automated testing identification
   *
   * Access this in your component template:
   * ```html
   * <div [attr.data-testid]="testId()">...</div>
   * ```
   */
  readonly testId = withTestId(this.content, this.name, this.testIdBuilder);

  /**
   * Computed signal for the group's hide strategy
   * Determines how the group behaves when hidden (keep or remove from form)
   */
  readonly hideStrategy = computed(() => this.content().hideStrategy);

  /**
   * Computed signal for the group's value strategy
   * Determines how the group's values are managed when visibility changes:
   * - 'last': preserves last values
   * - 'default': reverts to default values
   * - 'reset': clears values
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
   * True when the group should be hidden based on 'hidden' expression
   *
   * Use this in your component when implementing custom visibility handling:
   * ```typescript
   * readonly isHidden = this.control.isHidden;
   * ```
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
   * True when the group should be disabled based on 'disabled' expression
   *
   * Use this in your component for custom disabled state handling:
   * ```typescript
   * readonly disabled = this.control.disabled;
   * ```
   */
  readonly disabled = withDisabledState(this.content);

  /**
   * Computed signal for the readonly state
   * True when the group should be readonly based on 'readonly' expression
   *
   * Use this in your component to implement readonly behavior:
   * ```typescript
   * readonly readonly = this.control.readonly;
   * ```
   */
  readonly readonly = withReadonlyState(this.content);

  /**
   * Computed signal for the update strategy
   * Determines when form values are updated ('change', 'blur', or 'submit')
   */
  readonly updateStrategy = withUpdateStrategy(this.content);

  /**
   * Computed signal for the dynamic title
   * Contains the evaluated result of the dynamicTitle expression
   *
   * Use this in your component to display dynamic titles:
   * ```typescript
   * readonly displayTitle = computed(() => {
   *   const dynamic = this.control.dynamicTitle();
   *   return dynamic || this.content().title || '';
   * });
   * ```
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

  /**
   * Computed signal for the form group instance
   * Creates a new FormGroup with appropriate validators and configuration
   */
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

  /**
   * Computed signal for the title of the group
   * Returns the static title from the configuration
   */
  readonly title = computed(() => this.content().title);

  /**
   * Computed signal for the child controls of the group
   * Returns an array of [name, control] pairs for rendering
   */
  readonly controls = computed(() => Object.entries(this.content().controls));

  /**
   * Access to the parent FormGroup containing this group
   */
  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  /**
   * Access to this group's FormGroup instance
   * Use this to access validation state, errors, and other FormGroup methods
   */
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
   * Determines if visibility should be managed by the component (manual) or by Formbar (auto)
   *
   * Use 'manual' when implementing custom visibility handling in your component:
   * ```typescript
   * constructor() {
   *   this.control.setVisibilityHandling('manual');
   * }
   * ```
   *
   * @param visibilityHandling Strategy for handling visibility ('auto' or 'manual')
   */
  setVisibilityHandling(visibilityHandling: StateHandling) {
    this.visibilityHandling.set(visibilityHandling);
  }

  /**
   * Sets the disabled handling strategy
   * Determines if disabled state should be managed by the component (manual) or by Formbar (auto)
   *
   * Use 'manual' when implementing custom disabled state handling in your component:
   * ```typescript
   * constructor() {
   *   this.control.setDisabledHandling('manual');
   * }
   * ```
   *
   * @param disabledHandling Strategy for handling disabled state ('auto' or 'manual')
   */
  setDisabledHandling(disabledHandling: StateHandling) {
    this.disabledHandling.set(disabledHandling);
  }

  /**
   * Sets the function to use for building a test id.
   * This allows custom test ID generation strategies to be used.
   *
   * @param builderFn Function that returns the test id
   */
  setTestIdBuilderFn(builderFn: TestIdBuilderFn | undefined) {
    this.testIdBuilder.set(builderFn);
  }

  /**
   * Registers this group with the parent FormGroup
   * @private
   */
  private setGroup() {
    this.parentFormGroup?.setControl(this.name(), this.groupInstance(), {
      emitEvent: false,
    });
  }

  /**
   * Removes this group from the parent FormGroup
   * @private
   */
  private removeGroup() {
    const id = this.name();
    const formGroup = this.formGroup;
    // Check if control exists immediately before attempting removal
    if (formGroup) {
      this.parentFormGroup?.removeControl(id, { emitEvent: false });
    }
  }

  /**
   * Enables the form group
   * @private
   */
  private enableGroup() {
    const formGroup = this.groupInstance();
    formGroup.enable({ emitEvent: false });
  }

  /**
   * Disables the form group
   * @private
   */
  private disableGroup() {
    const formGroup = this.groupInstance();
    formGroup.disable({ emitEvent: false });
  }

  /**
   * Handles value changes when visibility changes
   * @param valueStrategy Strategy for handling values
   * @private
   */
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

  /**
   * Removes the group when the directive is destroyed
   */
  ngOnDestroy(): void {
    this.removeGroup();
  }
}
