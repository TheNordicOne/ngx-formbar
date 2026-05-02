/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import { test } from 'vitest';

test('type declarations compile', () => {
  // This file is a compile-time type test. If it builds, the types are correct.
});

import { InputSignal, InputSignalWithTransform } from '@angular/core';
import {
  NgxFbBlock,
  NgxFbControl,
  NgxFbFormGroup,
} from '@ngx-formbar/core';
import {
  FormbarBlock,
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
  min: number;
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
  readonly dynamicLabel: InputSignal<string | undefined>;
  readonly testId: InputSignal<string>;
  readonly hint: InputSignal<string | undefined>;
  readonly placeHolder: InputSignal<string | undefined>;
}

// minimal control — only name + all custom props (optional formbar props can be omitted)
declare class MinimalTextControl
  implements ReactiveFormbarControl<TextControl>
{
  readonly name: InputSignalWithTransform<string, string>;
  readonly hint: InputSignal<string | undefined>;
  readonly placeHolder: InputSignal<string | undefined>;
}

// no custom props — only name required
declare class MinimalCheckboxControl
  implements ReactiveFormbarControl<CheckboxControl>
{
  readonly name: InputSignalWithTransform<string, string>;
}

// required + optional custom props must both be declared
declare class MinimalNumberControl
  implements ReactiveFormbarControl<NumberControl>
{
  readonly name: InputSignalWithTransform<string, string>;
  readonly min: InputSignalWithTransform<number, number>;
  readonly max: InputSignal<number | undefined>;
}

// full group with all properties
declare class FullGroupControl implements ReactiveFormbarGroup<GroupControl> {
  readonly name: InputSignalWithTransform<string, string>;
  readonly isDisabled: InputSignal<boolean>;
  readonly isReadonly: InputSignal<boolean>;
  readonly isHidden: InputSignal<boolean>;
  readonly titleText: InputSignal<string | undefined>;
  readonly dynamicTitle: InputSignal<string | undefined>;
  readonly testId: InputSignal<string>;
  readonly legend: InputSignal<string | undefined>;
}

// minimal group - name + all custom props
declare class MinimalGroupControl
  implements ReactiveFormbarGroup<GroupControl>
{
  readonly name: InputSignalWithTransform<string, string>;
  readonly legend: InputSignal<string | undefined>;
}

// full block with all properties
declare class FullNoteBlock implements FormbarBlock<NoteControl> {
  readonly isHidden: InputSignal<boolean>;
  readonly testId: InputSignal<string>;
  readonly message: InputSignalWithTransform<string, string>;
  readonly severity: InputSignal<'info' | 'warn' | 'danger' | undefined>;
}

// minimal block — all custom props required, formbar props optional
declare class MinimalNoteBlock implements FormbarBlock<NoteControl> {
  readonly message: InputSignalWithTransform<string, string>;
  readonly severity: InputSignal<'info' | 'warn' | 'danger' | undefined>;
}

// @ts-expect-error — missing required 'min' and 'max'
declare class MissingMin implements ReactiveFormbarControl<NumberControl> {
  readonly name: InputSignalWithTransform<string, string>;
}

// @ts-expect-error — missing required 'hint' and 'placeHolder'
declare class MissingCustomProps
  implements ReactiveFormbarControl<TextControl>
{
  readonly name: InputSignalWithTransform<string, string>;
}

// @ts-expect-error — missing required 'name'
declare class MissingName implements ReactiveFormbarControl<CheckboxControl> {
  readonly isDisabled: InputSignal<boolean>;
}

// @ts-expect-error — missing required 'legend'
declare class MissingLegend implements ReactiveFormbarGroup<GroupControl> {
  readonly name: InputSignalWithTransform<string, string>;
}

// @ts-expect-error — missing required 'message' and 'severity'
declare class MissingMessage implements FormbarBlock<NoteControl> {
  readonly isHidden: InputSignal<boolean>;
}
