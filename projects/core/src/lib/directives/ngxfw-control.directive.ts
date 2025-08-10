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
import {
  setComputedValueEffect,
  withComputedValue,
} from '../composables/computed-value';
import { withDynamicLabel } from '../composables/dynamic-label';
import { TestIdBuilderFn } from '../types/functions.type';

/**
 * Core directive for creating form controls in ngx-formwork.
 *
 * This directive handles the integration between Angular's reactive forms and
 * ngx-formwork's declarative configuration. It manages:
 *
 * - Control registration and lifecycle within parent form groups
 * - State management (hidden, disabled, readonly)
 * - Validation setup
 * - Dynamic value computation
 * - Test ID generation
 * - Dynamic label support
 *
 * Use this directive with hostDirectives in your custom control components:
 *
 * ```typescript
 * @Component({
 *   hostDirectives: [
 *     {
 *       directive: NgxfwControlDirective,
 *       inputs: ['content', 'name'],
 *     }
 *   ],
 * })
 * export class TextControlComponent {
 *   private readonly control = inject(NgxfwControlDirective<TextControl>);
 *   readonly content = this.control.content;
 *   readonly name = this.control.name;
 * }
 * ```
 *
 * @template T Type of the control configuration, must extend NgxFwControl
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
   * Computed test ID derived from the control's ID
   * Used for automated testing identification
   *
   * Access this in your component template:
   * ```html
   * <input [attr.data-testid]="testId()" ... />
   * ```
   */
  readonly testId = withTestId(this.content, this.name, this.testIdBuilder);

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
   * True when the control should be hidden based on 'hidden' expression
   *
   * Use this in your component when implementing custom visibility handling:
   * ```typescript
   * readonly isHidden = this.control.isHidden;
   * ```
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
   * True when the control should be disabled based on 'disabled' expression
   *
   * Use this in your component for custom disabled state handling:
   * ```typescript
   * readonly disabled = this.control.disabled;
   * ```
   */
  readonly disabled = withDisabledState(this.content);

  /**
   * Computed signal for the readonly state
   * True when the control should be readonly based on 'readonly' expression
   *
   * Use this in your component to implement readonly behavior:
   * ```html
   * <input [attr.readonly]="readonly() || null" ... />
   * ```
   */
  readonly readonly = withReadonlyState(this.content);

  /**
   * Computed signal for the update strategy
   * Determines when form values are updated ('change', 'blur', or 'submit')
   */
  readonly updateStrategy = withUpdateStrategy(this.content);

  /**
   * Computed signal for the dynamic label
   * Contains the evaluated result of the dynamicLabel expression
   *
   * Use this in your component to display dynamic labels:
   * ```typescript
   * readonly displayLabel = computed(() => {
   *   const dynamic = this.control.dynamicLabel();
   *   return dynamic || this.content().label;
   * });
   * ```
   */
  readonly dynamicLabel = withDynamicLabel(this.content);

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
   * Computed signal for the computed value
   * Contains the evaluated result of computedValue expressions
   */
  private readonly computedValue = withComputedValue(this.content);

  /**
   * Computed signal for the form control instance
   * Creates a new FormControl with appropriate validators and configuration
   */
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

  /**
   * Access to the parent FormGroup containing this control
   */
  get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  /**
   * Access to this control's FormControl instance
   * Use this to access validation state, errors, and other FormControl methods
   *
   * Example:
   * ```typescript
   * get hasError() {
   *   return this.control.formControl?.hasError('required');
   * }
   * ```
   */
  get formControl() {
    const id = this.name();
    if (!this.parentFormGroup?.contains(id)) {
      return null;
    }

    return this.parentFormGroup.get(id) as FormControl | null;
  }

  constructor() {
    hiddenEffect({
      content: this.content,
      name: this.name,
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

    setComputedValueEffect({
      controlInstance: this.controlInstance,
      computeValueSignal: this.computedValue,
    });
  }

  /**
   * Sets the visibility handling strategy
   * Determines if visibility should be managed by the component (manual) or by Formwork (auto)
   *
   * Use 'manual' when implementing custom visibility handling in your component:
   * ```typescript
   * constructor() {
   *   this.control.setVisibilityHandling('manual');
   * }
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

  private setControl() {
    this.parentFormGroup?.setControl(this.name(), this.controlInstance(), {
      emitEvent: false,
    });
  }

  private removeControl() {
    const id = this.name();
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
