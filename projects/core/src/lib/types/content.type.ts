type NgxFwBaseContent = {
  type: string;
  validators?: string[];
  asyncValidators?: string[];
  hidden?: string;
  hideStrategy?: HideStrategy;
  valueStrategy?: ValueStrategy;
  disabled?: string | boolean;
  readonly?: string | boolean;
};

export type NgxFwFormGroup = NgxFwBaseContent & {
  id: string;
  title?: string;
  controls: NgxFwContent[];
};

export type NgxFwControl = NgxFwBaseContent & {
  id: string;
  label: string;
  defaultValue?: unknown;
  nonNullable?: boolean;
  [key: string]: unknown;
};

export type NgxFwContent = NgxFwFormGroup | NgxFwControl;

export type HideStrategy = 'keep' | 'remove';
export type ValueStrategy = 'last' | 'default' | 'reset';
