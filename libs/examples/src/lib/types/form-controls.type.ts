import { TextControl } from './text-control.type';
import { NumberControl } from './number-control.type';
import { CheckboxControl } from './checkbox-control.type';
import { RadioControl } from './radio-control.type';
import { DropdownControl } from './dropdown-control.type';
import { GroupControl } from './group-control.type';
import { NoteControl } from './note-control.type';
import { TextareaControl } from './textarea-control.type';
import { DateControl } from './date-control.type';
import { FileControl } from './file-control.type';
import { ManualTextControl } from './manual-text-control.type';

export type ExampleControls =
  | TextControl
  | NumberControl
  | CheckboxControl
  | RadioControl
  | DropdownControl
  | GroupControl<ExampleControls>
  | NoteControl
  | TextareaControl
  | DateControl
  | FileControl
  | ManualTextControl;
