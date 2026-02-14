import { Type } from '@angular/core';
import {
  ComponentRegistrationConfig,
  NGX_FW_COMPONENT_REGISTRATIONS,
} from '@ngx-formbar/core';
import { TextControlComponent } from '../controls/text/text-control.component';
import { NumberControlComponent } from '../controls/number/number-control.component';
import { CheckboxControlComponent } from '../controls/checkbox/checkbox-control.component';
import { RadioControlComponent } from '../controls/radio/radio-control.component';
import { DropdownControlComponent } from '../controls/dropdown/dropdown-control.component';
import { GroupControlComponent } from '../controls/group/group-control.component';
import { NoteControlComponent } from '../blocks/note/note-control.component';
import { TextareaControlComponent } from '../controls/textarea/textarea-control.component';
import { DateControlComponent } from '../controls/date/date-control.component';
import { FileControlComponent } from '../controls/file/file-control.component';

// Config-based registration (for use with defineFormbarConfig / provideFormbar)
export const componentRegistrations: ComponentRegistrationConfig = {
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

// Token-based registration (for use as a provider)
export const componentRegistrationsProvider = {
  provide: NGX_FW_COMPONENT_REGISTRATIONS,
  useValue: new Map<string, Type<unknown>>([
    ['text', TextControlComponent],
    ['number', NumberControlComponent],
    ['checkbox', CheckboxControlComponent],
    ['radio', RadioControlComponent],
    ['dropdown', DropdownControlComponent],
    ['group', GroupControlComponent],
    ['note', NoteControlComponent],
    ['textarea', TextareaControlComponent],
    ['date', DateControlComponent],
    ['file', FileControlComponent],
  ]),
};
