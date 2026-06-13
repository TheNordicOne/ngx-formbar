import { Expression } from './expression.type';

/**
 * Base shape shared by all form content. Carries the type identifier
 * and the optional hidden expression.
 */
export interface NgxFbBaseContent {
  /**
   * Identifier of the content type. Selects which component is used
   * and which additional properties apply.
   */
  type: string;
  /**
   * Expression evaluated against the form value that controls visibility.
   * Accepts a string expression or a predicate function.
   */
  hidden?: Expression<boolean> | boolean;
}

/**
 * Adds validation and state options on top of {@link NgxFbBaseContent}.
 * Shared by form controls and form groups.
 */
export interface NgxFbAbstractControl extends NgxFbBaseContent {
  /**
   * Names of synchronous validators registered globally for this control.
   */
  validators?: string[];
  /**
   * Names of asynchronous validators registered globally for this control.
   */
  asyncValidators?: string[];
  /**
   * Whether the control is disabled. Accepts a boolean, string expression,
   * or predicate function evaluated against the form value.
   */
  disabled?: Expression<boolean> | boolean;
  /** @see {@link HideStrategy} */
  hideStrategy?: HideStrategy;
  /** @see {@link ValueStrategy} */
  valueStrategy?: ValueStrategy;
  /**
   * Whether the control is read-only. Accepts a boolean, string expression,
   * or predicate function evaluated against the form value.
   */
  readonly?: Expression<boolean> | boolean;
  /** @see {@link UpdateStrategy} */
  updateOn?: UpdateStrategy;
  /**
   * Value derived from the form. Overwrites user input whenever a dependency changes.
   */
  computedValue?: Expression<unknown>;
}

/**
 * When the control's value is written back to the form model.
 * - `change`: as the user types (default).
 * - `blur`: when the control loses focus.
 * - `submit`: when the form is submitted.
 */
export type UpdateStrategy = 'change' | 'blur' | 'submit' | undefined;

/**
 * A group of nested form controls.
 */
export interface NgxFbFormGroup<T extends NgxFbBaseContent = NgxFbItem>
  extends NgxFbAbstractControl {
  /** Static title for the group. */
  title?: string;
  /** Title evaluated from form data. */
  dynamicTitle?: Expression<string>;
  /** Child controls keyed by name. */
  controls: Record<string, T>;
}

/**
 * An individual form control with label and value properties.
 */
export interface NgxFbControl extends NgxFbAbstractControl {
  /** Static label for the control. */
  label?: string;
  /** Label evaluated from form data. */
  dynamicLabel?: Expression<string>;
  /**
   * Default value for the control. Narrow this in extending interfaces
   * to match the control's value type.
   */
  defaultValue?: unknown;
  /**
   * Whether the control rejects null. Maps to the `nonNullable` option
   * on reactive form controls.
   */
  nonNullable?: boolean;
}

/**
 * An individual form control with label and value properties.
 */
export interface NgxFbArray<T extends NgxFbBaseContent = NgxFbItem>
  extends NgxFbAbstractControl {
  /**
   * Control definition of a single item in an array. The row's top control
   * may not set `hideStrategy: 'remove'`: the array renders its rows from the
   * `FormArray`, so a removed row top could never be restored. Hiding still
   * works; only the `remove` strategy is disallowed at the row top. Controls
   * nested inside a group row keep full `hideStrategy` support.
   */
  rowControl: T & { hideStrategy?: 'keep' };
  /** Static label for the control. */
  label?: string;
  /** Label evaluated from form data. */
  dynamicLabel?: Expression<string>;
  /**
   * Default value for the control. Narrow this in extending interfaces
   * to match the control's value type.
   */
  defaultValue?: unknown;
  /**
   * Whether the control rejects null. Maps to the `nonNullable` option
   * on reactive form controls.
   */
  nonNullable?: boolean;
}

/**
 * A non-control content element such as a heading or divider.
 */
export interface NgxFbBlock extends NgxFbBaseContent {
  /** Discriminator that lets TypeScript narrow {@link NgxFbItem}. */
  isControl: false;
  [key: string]: unknown;
}

/** Any content that can appear in a form. */
export type NgxFbItem = NgxFbFormGroup | NgxFbControl | NgxFbArray | NgxFbBlock;

/**
 * What happens to the form control when hidden.
 * - `keep`: stays in the form model.
 * - `remove`: detached from the form model.
 */
export type HideStrategy = 'keep' | 'remove';

/**
 * What happens to the control's value when visibility changes.
 * - `last`: preserves the last value.
 * - `default`: reverts to the default value.
 * - `reset`: clears the value.
 */
export type ValueStrategy = 'last' | 'default' | 'reset';

/**
 * Pairs a content node with the name it is bound under in its parent group.
 * Consumed by directives and outlets that render a single named entry from a
 * configuration tree.
 */
export type FormConfigEntry<T> = { name: string; config: T };
