import { isSignal, Signal } from '@angular/core';
import {
  NgxFbArray,
  NgxFbBaseContent,
  NgxFbBlock,
  NgxFbControl,
  NgxFbFormGroup,
  NgxFbItem,
} from '../types/content.type';

export function isFormbarGroup<T extends NgxFbBaseContent = NgxFbItem>(
  item: Signal<T>,
): item is Signal<T & NgxFbFormGroup>;
export function isFormbarGroup<T extends NgxFbBaseContent = NgxFbItem>(
  item: T,
): item is T & NgxFbFormGroup;
export function isFormbarGroup(
  item: NgxFbBaseContent | Signal<NgxFbBaseContent>,
): boolean {
  const value = isSignal(item) ? item() : item;
  return 'controls' in value;
}

export function isFormbarArray<T extends NgxFbBaseContent = NgxFbItem>(
  item: Signal<T>,
): item is Signal<T & NgxFbArray>;
export function isFormbarArray<T extends NgxFbBaseContent = NgxFbItem>(
  item: T,
): item is T & NgxFbArray;
export function isFormbarArray(
  item: NgxFbBaseContent | Signal<NgxFbBaseContent>,
): boolean {
  const value = isSignal(item) ? item() : item;
  return 'rowControls' in value;
}

export function isFormbarControl<T extends NgxFbBaseContent = NgxFbItem>(
  item: Signal<T>,
): item is Signal<T & NgxFbControl>;
export function isFormbarControl<T extends NgxFbBaseContent = NgxFbItem>(
  item: T,
): item is T & NgxFbControl;
export function isFormbarControl(
  item: NgxFbBaseContent | Signal<NgxFbBaseContent>,
): boolean {
  const value = isSignal(item) ? item() : item;
  return !('controls' in value) && !('rowControls' in value);
}

export function isFormbarBlock<T extends NgxFbBaseContent = NgxFbItem>(
  item: Signal<T>,
): item is Signal<T & NgxFbBlock>;
export function isFormbarBlock<T extends NgxFbBaseContent = NgxFbItem>(
  item: T,
): item is T & NgxFbBlock;

export function isFormbarBlock(
  item: NgxFbBaseContent | Signal<NgxFbBaseContent>,
): boolean {
  const value = isSignal(item) ? item() : item;
  return 'isControl' in value && value.isControl === false;
}
