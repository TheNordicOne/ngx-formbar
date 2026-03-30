import { TextControlComponent } from '../components/text/text-control.component';
import { NumberControlComponent } from '../components/number/number-control.component';
import { CheckboxControlComponent } from '../components/checkbox/checkbox-control.component';
import { RadioControlComponent } from '../components/radio/radio-control.component';
import { DropdownControlComponent } from '../components/dropdown/dropdown-control.component';
import { GroupControlComponent } from '../components/group/group-control.component';
import { NoteControlComponent } from '../components/note/note-control.component';
import { TextareaControlComponent } from '../components/textarea/textarea-control.component';
import { DateControlComponent } from '../components/date/date-control.component';
import { FileControlComponent } from '../components/file/file-control.component';
import { ComponentRegistrations } from '@ngx-formbar/examples';

export const componentRegistrations: ComponentRegistrations = {
  text: TextControlComponent,
  number: NumberControlComponent,
  checkbox: CheckboxControlComponent,
  radio: RadioControlComponent,
  dropdown: DropdownControlComponent,
  group: GroupControlComponent,
  note: NoteControlComponent,
  textarea: TextareaControlComponent,
  date: DateControlComponent,
  file: FileControlComponent,
};
