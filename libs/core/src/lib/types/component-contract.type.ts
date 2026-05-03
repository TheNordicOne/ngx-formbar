import { InputSignal, InputSignalWithTransform } from '@angular/core';
import { NgxFbBaseContent, NgxFbBlock } from './content.type';

export type SignalInput<T> =
  | InputSignal<T>
  | InputSignalWithTransform<T, unknown>;

export type ToSignalInputs<T> = {
  [K in keyof T]-?: SignalInput<T[K]>;
};

export type RemoveIndexSignature<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
      ? never
      : K]: T[K];
};

export type BlockManagedKeys =
  | keyof NgxFbBaseContent
  | 'isControl'
  | 'hideStrategy';

export type ExtendedBlockInputs<T extends NgxFbBlock> = Omit<
  RemoveIndexSignature<T>,
  BlockManagedKeys
>;
