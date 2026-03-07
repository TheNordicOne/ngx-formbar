import { TextControl } from '../components/text/text-control.type';
import { NumberControl } from '../components/number/number-control.type';
import { CheckboxControl } from '../components/checkbox/checkbox-control.type';
import { RadioControl } from '../components/radio/radio-control.type';
import { DropdownControl } from '../components/dropdown/dropdown-control.type';
import { GroupControl } from '../components/group/group-control.type';
import { NoteControl } from '../components/note/note-control.type';
import { TextareaControl } from '../components/textarea/textarea-control.type';
import { DateControl } from '../components/date/date-control.type';
import { FileControl } from '../components/file/file-control.type';

export type ExampleControls =
  | TextControl
  | NumberControl
  | CheckboxControl
  | RadioControl
  | DropdownControl
  | GroupControl
  | NoteControl
  | TextareaControl
  | DateControl
  | FileControl;
