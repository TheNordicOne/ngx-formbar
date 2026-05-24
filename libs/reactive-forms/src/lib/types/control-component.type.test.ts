/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import { test } from 'vitest';

test('type declarations compile', () => {
  // This file is a compile-time type test. If it builds, the types are correct.
});

import { InputSignal, InputSignalWithTransform } from '@angular/core';
import {
  NgxFbArray,
  NgxFbBlock,
  NgxFbControl,
  NgxFbFormGroup,
} from '@ngx-formbar/core';
import {
  FormbarBlock,
  ReactiveFormbarArray,
  ReactiveFormbarControl,
  ReactiveFormbarGroup,
} from './control-component.type';

interface TextControl extends NgxFbControl {
  type: 'text';
  defaultValue?: string;
  hint?: string;
  placeHolder?: string;
}

interface NumberControl extends NgxFbControl {
  type: 'number';
  min?: number;
  max?: number;
}

interface CheckboxControl extends NgxFbControl {
  type: 'checkbox';
}

interface GroupControl extends NgxFbFormGroup {
  type: 'group';
  legend?: string;
}

interface NoteControl extends NgxFbBlock {
  type: 'note';
  message: string;
  severity?: 'info' | 'warn' | 'danger';
}

// full implementation with all properties
declare class FullTextControl implements ReactiveFormbarControl<TextControl> {
  readonly name: InputSignalWithTransform<string, string>;
  readonly isDisabled: InputSignal<boolean>;
  readonly isReadonly: InputSignal<boolean>;
  readonly isHidden: InputSignal<boolean>;
  readonly labelText: InputSignal<string | undefined>;
  readonly dynamicLabel: InputSignal<string | null | undefined>;
  readonly testId: InputSignal<string>;
  readonly hint: InputSignal<string | undefined>;
  readonly placeHolder: InputSignal<string | undefined>;
}

// minimal control — only name required (optional custom props can be omitted)
declare class MinimalTextControl
  implements ReactiveFormbarControl<TextControl>
{
  readonly name: InputSignalWithTransform<string, string>;
}

// no custom props — only name required
declare class MinimalCheckboxControl
  implements ReactiveFormbarControl<CheckboxControl>
{
  readonly name: InputSignalWithTransform<string, string>;
}

// no required custom props — only name required
declare class MinimalNumberControl
  implements ReactiveFormbarControl<NumberControl>
{
  readonly name: InputSignalWithTransform<string, string>;
}

// optional custom props included — type includes undefined
declare class FullNumberControl
  implements ReactiveFormbarControl<NumberControl>
{
  readonly name: InputSignalWithTransform<string, string>;
  readonly min: InputSignal<number | undefined>;
  readonly max: InputSignal<number | undefined>;
}

// full group with all properties
declare class FullGroupControl implements ReactiveFormbarGroup<GroupControl> {
  readonly name: InputSignalWithTransform<string, string>;
  readonly isDisabled: InputSignal<boolean>;
  readonly isReadonly: InputSignal<boolean>;
  readonly isHidden: InputSignal<boolean>;
  readonly titleText: InputSignal<string | undefined>;
  readonly dynamicTitle: InputSignal<string | null | undefined>;
  readonly testId: InputSignal<string>;
  readonly legend: InputSignal<string | undefined>;
}

// minimal group — name only (legend is optional)
declare class MinimalGroupControl
  implements ReactiveFormbarGroup<GroupControl>
{
  readonly name: InputSignalWithTransform<string, string>;
}

interface ArrayControl extends NgxFbArray {
  type: 'array';
  addLabel?: string;
}

// full array with all properties
declare class FullArrayControl implements ReactiveFormbarArray<ArrayControl> {
  readonly name: InputSignalWithTransform<string, string>;
  readonly isDisabled: InputSignal<boolean>;
  readonly isReadonly: InputSignal<boolean>;
  readonly isHidden: InputSignal<boolean>;
  readonly labelText: InputSignal<string | undefined>;
  readonly dynamicLabel: InputSignal<string | null | undefined>;
  readonly testId: InputSignal<string>;
  readonly addLabel: InputSignal<string | undefined>;
}

// minimal array — name only
declare class MinimalArrayControl
  implements ReactiveFormbarArray<ArrayControl>
{
  readonly name: InputSignalWithTransform<string, string>;
}

// full block with all properties
declare class FullNoteBlock implements FormbarBlock<NoteControl> {
  readonly isHidden: InputSignal<boolean>;
  readonly testId: InputSignal<string>;
  readonly message: InputSignalWithTransform<string, string>;
  readonly severity: InputSignal<'info' | 'warn' | 'danger' | undefined>;
}

// minimal block — only required custom props
declare class MinimalNoteBlock implements FormbarBlock<NoteControl> {
  readonly message: InputSignalWithTransform<string, string>;
}

// @ts-expect-error — missing required 'name'
declare class MissingName implements ReactiveFormbarControl<CheckboxControl> {
  readonly isDisabled: InputSignal<boolean>;
}

// @ts-expect-error — missing required 'message'
declare class MissingMessage implements FormbarBlock<NoteControl> {
  readonly isHidden: InputSignal<boolean>;
}
