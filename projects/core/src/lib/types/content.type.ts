import { OneOf } from './helper.type';

/**
 * Base configuration for Ngx Formwork components
 *
 * @property type - Component type identifier
 * @property id - Unique identifier for the group
 * @property validators - Array of validator identifiers to apply
 * @property asyncValidators - Array of asynchronous validator identifiers
 * @property hidden - Expression that evaluates to determine visibility
 * @property hideStrategy - How the component behaves when hidden
 * @property valueStrategy - How values are handled during visibility changes
 * @property disabled - Expression or boolean determining disabled state
 * @property readonly - Expression or boolean determining readonly state
 * @property updateOn - Update strategy for the control
 */
type NgxFwBaseContent = {
  type: string;
  id: string;
  validators?: string[];
  asyncValidators?: string[];
  hidden?: string;
  hideStrategy?: HideStrategy;
  valueStrategy?: ValueStrategy;
  disabled?: string | boolean;
  readonly?: string | boolean;
  updateOn?: UpdateStrategy;
};

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
 * type AddressGroup = NgxFwFormGroup & {
 *   type: 'address-group';
 *   collapsible?: boolean;
 *   addressFormat?: 'US' | 'EU';
 * };
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
export type NgxFwFormGroup = NgxFwBaseContent & {
  title?: string;
  controls: NgxFwContent[];
};

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
 * type DropdownControl = NgxFwControl & {
 *   type: 'dropdown';
 *   options: Array<{value: string, label: string}>;
 *   allowMultiple?: boolean;
 *   searchable?: boolean;
 * };
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
export type NgxFwControl = NgxFwBaseContent & {
  label: string;
  defaultValue?: unknown;
  nonNullable?: boolean;
};

/**
 * Union type representing either a form group or individual control
 */
export type NgxFwContent = OneOf<[NgxFwFormGroup, NgxFwControl]>;

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
