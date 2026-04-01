import { staticComponent, loadComponent } from '@ngx-formbar/core';
import { ComponentRegistrations } from '@ngx-formbar/examples';
import { TextControlComponent } from '../components/text/text-control.component';
import { CheckboxControlComponent } from '../components/checkbox/checkbox-control.component';
import { NoteControlComponent } from '../components/note/note-control.component';
import { NumberControlComponent } from '../components/number/number-control.component';

export const componentRegistrations: ComponentRegistrations = {
  text: staticComponent(TextControlComponent),
  number: staticComponent(NumberControlComponent),
  checkbox: staticComponent(CheckboxControlComponent),
  radio: loadComponent(() =>
    import('../components/radio/radio-control.component').then(
      (m) => m.RadioControlComponent,
    ),
  ),
  dropdown: loadComponent(() =>
    import('../components/dropdown/dropdown-control.component').then(
      (m) => m.DropdownControlComponent,
    ),
  ),
  group: loadComponent(() =>
    import('../components/group/group-control.component').then(
      (m) => m.GroupControlComponent,
    ),
  ),
  note: staticComponent(NoteControlComponent),
  textarea: loadComponent(() =>
    import('../components/textarea/textarea-control.component').then(
      (m) => m.TextareaControlComponent,
    ),
  ),
  date: loadComponent(() =>
    import('../components/date/date-control.component').then(
      (m) => m.DateControlComponent,
    ),
  ),
  file: loadComponent(() =>
    import('../components/file/file-control.component').then(
      (m) => m.FileControlComponent,
    ),
  ),
};
