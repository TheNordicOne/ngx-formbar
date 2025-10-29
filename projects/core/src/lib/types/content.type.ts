import { Expression } from './expression.type';

/**
 * The foundation for all form controls and groups. It defines a common set of options
 * that control registration, validation, visibility, and behavior of the form elements.
 */
export interface NgxFwBaseContent {
  /**
   * Specifies the kind of form control. Determines what control is used and what
   * additional properties are available.
   */
  type: string;
  /**
   * A string expression that determines when the control should be hidden.
   * This condition is evaluated at runtime against the whole form object.
   */
  hidden?: Expression<boolean>;
}

/**
 * Extends the base content with validation and control state management properties.
 * Used as a base for both form controls and groups.
 */
export interface NgxFwAbstractControl extends NgxFwBaseContent {
  /**
   * Array of strings representing names of synchronous validators that apply to the control.
   * These can be registered globally with a validator registration object.
   */
  validators?: string[];
  /**
   * Similar to validators, but for asynchronous validation logic that may involve
   * API calls or other deferred operations.
   */
  asyncValidators?: string[];
  /**
   * Defines whether the control should be disabled. Can be a boolean value or a
   * string expression that evaluates against the form object.
   */
  disabled?: Expression<boolean> | boolean;
  /**
   * Specifies how to handle the control when hidden: 'keep' (remains in form model)
   * or 'remove' (removed from form model).
   */
  hideStrategy?: HideStrategy;
  /**
   * Determines how the control's value is handled when visibility changes:
   * 'last' (preserves last value), 'default' (reverts to default value),
   * or 'reset' (clears value).
   */
  valueStrategy?: ValueStrategy;
  /**
   * Indicates if the control is read-only (displayed but not modifiable).
   * Accepts either a boolean value or a string expression for dynamic evaluation.
   */
  readonly?: Expression<boolean> | boolean;
  /**
   * Specifies when to update the control's value: 'change' (as user types, default),
   * 'blur' (when control loses focus), or 'submit' (when form is submitted).
   */
  updateOn?: UpdateStrategy;
  /**
   * A value that is automatically derived and set for the control.
   * It will overwrite user input if one of its dependencies changes.
   */
  computedValue?: Expression<unknown>;
}

/**
 * Specifies when to update the control's value:
 * - 'change': as user types (default)
 * - 'blur': when control loses focus
 * - 'submit': when form is submitted
 */
export type UpdateStrategy = 'change' | 'blur' | 'submit' | undefined;

/**
 * Represents a group of controls that can be nested within a form.
 */
export interface NgxFwFormGroup<T extends NgxFwBaseContent = NgxFwContent>
  extends NgxFwAbstractControl {
  /**
   * Specifies a title for the group
   */
  title?: string;
  /**
   * Dynamic title that can be evaluated from form data
   */
  dynamicTitle?: Expression<string>;
  /**
   * Object mapping keys to NgxFwContent that configure the controls of the group
   */
  controls: Record<string, T>;
}

/**
 * Represents an individual form control with label and value properties.
 */
export interface NgxFwControl extends NgxFwAbstractControl {
  /**
   * Specifies the label for the control
   */
  label?: string;
  /**
   * Dynamic label that can be evaluated from form data
   */
  dynamicLabel?: Expression<string>;
  /**
   * Default value for the control. Should be overwritten with the proper value type of the control.
   */
  defaultValue?: unknown;
  /**
   * Whether this control can have a null value. Used to set the same property through the reactive forms API.
   */
  nonNullable?: boolean;
}

/**
 * Represents a block element that doesn't behave like a form control.
 * Used for UI elements that aren't part of the form model.
 */
export interface NgxFwBlock extends NgxFwBaseContent {
  /**
   * Required property for TypeScript to properly do type narrowing
   */
  isControl: false;
  [key: string]: unknown;
}

/**
 * Union type representing all possible content types that can be used in a form.
 */
export type NgxFwContent = NgxFwFormGroup | NgxFwControl | NgxFwBlock;

/**
 * Specifies how to handle the control when hidden:
 * - 'keep': control remains in form model
 * - 'remove': control is removed from form model
 */
export type HideStrategy = 'keep' | 'remove';

/**
 * Determines how the control's value is handled when visibility changes:
 * - 'last': preserves last value
 * - 'default': reverts to default value
 * - 'reset': clears value
 */
export type ValueStrategy = 'last' | 'default' | 'reset';
