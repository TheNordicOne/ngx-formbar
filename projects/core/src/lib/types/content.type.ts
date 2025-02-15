import { OneOf } from '../helper/type.helper';

type NgxFwBaseContent = {
  type: string;
};

export type NgxFwFormGroup = NgxFwBaseContent & {
  id: string;
  title?: string;
};

export type NgxFwControl = NgxFwBaseContent & {
  id: string;
  label: string;
};

export type NgxFwContent = OneOf<[NgxFwFormGroup, NgxFwControl]>;
