import { ValueStrategy } from './content.type';

export type SimpleFunction = () => void;
export type ValueHandleFunction = (valueStrategy?: ValueStrategy) => void;
