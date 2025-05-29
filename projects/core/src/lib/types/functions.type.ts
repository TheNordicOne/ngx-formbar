import { NgxFwBaseContent, ValueStrategy } from './content.type';

export type SimpleFunction = () => void;
export type ValueHandleFunction = (valueStrategy?: ValueStrategy) => void;
export type TestIdBuilderFn = (
  content: NgxFwBaseContent,
  parentTestId?: string,
) => string;
