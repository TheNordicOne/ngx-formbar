import { Expression } from './expression.type';

export interface NgxFwBaseContent {
  type: string;
  id: string;
  hidden?: Expression<boolean>;
}

export interface NgxFwAbstractControl extends NgxFwBaseContent {
  validators?: string[];
  asyncValidators?: string[];
  disabled?: Expression<boolean> | boolean;
  hideStrategy?: HideStrategy;
  valueStrategy?: ValueStrategy;
  readonly?: Expression<boolean> | boolean;
  updateOn?: UpdateStrategy;
  computedValue?: Expression<unknown>;
}

export type UpdateStrategy = 'change' | 'blur' | 'submit' | undefined;

/**
 * Base Configuration for a form group in Ngx Formwork
 *
 * Form groups contain and organize multiple controls or nested groups.
 * They inherit all properties from NgxFwBaseContent and add group-specific properties.
 *
 * @property title - Optional display title for the group
 * @property controls - Array of child controls and groups
 *
 * @example
 * // Define a custom address group type
 * interface AddressGroup extends NgxFwFormGroup {
 *   type: 'address-group';
 *   collapsible?: boolean;
 *   addressFormat?: 'US' | 'EU';
 * }
 *
 * // Usage in a form definition
 * const addressSection: AddressGroup = {
 *   id: 'shipping-address',
 *   type: 'address-group',
 *   title: 'Shipping Address',
 *   collapsible: true,
 *   addressFormat: 'US',
 *   hideStrategy: 'remove',
 *   controls: [
 *     {
 *       id: 'street',
 *       type: 'text-input',
 *       label: 'Street Address',
 *       validators: ['required']
 *     },
 *     {
 *       id: 'city',
 *       type: 'text-input',
 *       label: 'City',
 *       validators: ['required']
 *     },
 *     {
 *       id: 'zipcode',
 *       type: 'text-input',
 *       label: 'ZIP Code',
 *       validators: ['required', 'zipcode']
 *     }
 *   ]
 * };
 */
export interface NgxFwFormGroup<T extends NgxFwBaseContent = NgxFwContent>
  extends NgxFwAbstractControl {
  title?: string;
  dynamicTitle?: Expression<string>;
  controls: T[];
}

/**
 * Base Configuration for an individual form control in Ngx Formwork
 *
 * Form controls represent individual input elements that capture user data.
 * They inherit all properties from NgxFwBaseContent and add control-specific properties.
 *
 * @property label - Display label for the control
 * @property defaultValue - Initial value for the control
 * @property nonNullable - Whether the control should be treated as non-nullable
 *
 * @example
 * // Define a custom dropdown control type
 * interface DropdownControl extends NgxFwControl {
 *   type: 'dropdown';
 *   options: Array<{value: string, label: string}>;
 *   allowMultiple?: boolean;
 *   searchable?: boolean;
 * }
 *
 * // Usage in a form definition
 * const countrySelector: DropdownControl = {
 *   id: 'country',
 *   type: 'dropdown',
 *   label: 'Select Country',
 *   options: [
 *     {value: 'us', label: 'United States'},
 *     {value: 'ca', label: 'Canada'}
 *   ],
 *   searchable: true,
 *   validators: ['required'],
 *   disabled: false
 * };
 */
export interface NgxFwControl extends NgxFwAbstractControl {
  label: string;
  dynamicLabel?: Expression<string>;
  defaultValue?: unknown;
  nonNullable?: boolean;
}

/**
 * Base type for non-interactive content elements in Ngx Formwork, such as informational texts or decorative elements.
 *
 * Blocks extend `NgxFwBaseContent` (providing `id`, `type`, and `hidden` properties)
 * and can include any other custom properties of `unknown` type. This allows for flexible and diverse
 * content structures within the form that are not form controls or groups.
 *
 * @example
 * // Define a custom informational block
 * interface InfoBlock extends NgxFwBlock {
 *   type: 'info-block';
 *   message: string;
 *   severity?: 'info' | 'warning' | 'error';
 * }
 *
 * // Usage in a form definition
 * const infoMessage: InfoBlock = {
 *   id: 'welcome-info',
 *   type: 'info-block',
 *   message: 'Welcome to the form!',
 *   severity: 'info'
 *   // Required property for TypeScript to properly do type narrowing
 *   isControl: false;
 * };
 */
export interface NgxFwBlock extends NgxFwBaseContent {
  // Required property for TypeScript to properly do type narrowing
  isControl: false;
}

/**
 * Union type representing either a form group, individual control or a block
 */
export type NgxFwContent = NgxFwFormGroup | NgxFwControl | NgxFwBlock;

/**
 * Strategy for handling hidden form elements
 *
 * - 'keep': The control remains in the form model even when hidden
 * - 'remove': The control is removed from the form model when hidden
 */
export type HideStrategy = 'keep' | 'remove';

/**
 * Strategy for handling control values during visibility changes
 *
 * - 'last': Preserves the last input value when hidden/shown
 * - 'default': Resets to the specified default value when shown
 * - 'reset': Clears the value when shown
 */
export type ValueStrategy = 'last' | 'default' | 'reset';
