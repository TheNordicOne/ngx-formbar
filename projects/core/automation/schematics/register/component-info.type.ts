/**
 * Represents information about a discovered Formbar component
 */
export interface FormbarComponentInfo {
  /** The path to the component file */
  componentFilePath: string;
  /** The name of the component class */
  componentClassName: string;
  /** The key under which to register the component (equals the dasherized class name minus Component suffix */
  key: string;
}
