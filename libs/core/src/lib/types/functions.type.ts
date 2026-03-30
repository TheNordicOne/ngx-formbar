import { NgxFbBaseContent, ValueStrategy } from './content.type';

export type SimpleFunction = () => void;
export type ValueHandleFunction = (valueStrategy?: ValueStrategy) => void;
export type TestIdBuilderFn = (
  content: NgxFbBaseContent,
  name: string,
  parentTestId?: string,
) => string;
