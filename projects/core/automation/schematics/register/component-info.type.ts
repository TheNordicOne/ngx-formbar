/**
 * Represents the type of a Formwork component
 */
export const FormworkComponentType = {
  Block: 'block',
  Group: 'group',
  Control: 'control',
} as const;

export type FormworkComponentType =
  (typeof FormworkComponentType)[keyof typeof FormworkComponentType];

/**
 * Represents information about a discovered Formwork component
 */
export interface FormworkComponentInfo {
  /** The type of the component (block, group, or control) */
  type: FormworkComponentType;
  /** The path to the component file */
  filePath: string;
  /** The name of the component class */
  className: string;
  /** The selector of the component */
  selector?: string;
  /** The inputs passed to the directive */
  directiveInputs: string[];
}
