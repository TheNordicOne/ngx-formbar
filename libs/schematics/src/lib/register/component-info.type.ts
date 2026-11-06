/**
 * Represents information about a discovered Formbar component
 */
export interface FormbarComponentInfo {
  /** The path to the component file */
  componentFilePath: string;
  /** The name of the component class */
  componentClassName: string;
  /** The key under which to register the component */
  key: string;
  /** Logged once the entry is added, which a re-run or a taken key prevents */
  addedWarning?: string;
}
