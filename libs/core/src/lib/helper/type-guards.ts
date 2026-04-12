import { isSignal, Signal } from '@angular/core';
import {
  NgxFbBaseContent,
  NgxFbBlock,
  NgxFbContent,
  NgxFbControl,
  NgxFbFormGroup,
} from '../types/content.type';

export function isFormbarGroup<T extends NgxFbBaseContent = NgxFbContent>(
  item: Signal<T>,
): item is Signal<T & NgxFbFormGroup>;
export function isFormbarGroup<T extends NgxFbBaseContent = NgxFbContent>(
  item: T,
): item is T & NgxFbFormGroup;
export function isFormbarGroup(
  item: NgxFbBaseContent | Signal<NgxFbBaseContent>,
): boolean {
  const value = isSignal(item) ? item() : item;
  return 'controls' in value;
}

export function isFormbarControl<T extends NgxFbBaseContent = NgxFbContent>(
  item: Signal<T>,
): item is Signal<T & NgxFbControl>;
export function isFormbarControl<T extends NgxFbBaseContent = NgxFbContent>(
  item: T,
): item is T & NgxFbControl;
export function isFormbarControl(
  item: NgxFbBaseContent | Signal<NgxFbBaseContent>,
): boolean {
  const value = isSignal(item) ? item() : item;
  return !('controls' in value);
}

export function isFormbarBlock<T extends NgxFbBaseContent = NgxFbContent>(
  item: Signal<T>,
): item is Signal<T & NgxFbBlock>;
export function isFormbarBlock<T extends NgxFbBaseContent = NgxFbContent>(
  item: T,
): item is T & NgxFbBlock;

export function isFormbarBlock(
  item: NgxFbBaseContent | Signal<NgxFbBaseContent>,
): boolean {
  const value = isSignal(item) ? item() : item;
  return 'isControl' in value && value.isControl === false;
}
