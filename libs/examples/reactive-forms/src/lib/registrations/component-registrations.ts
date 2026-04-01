import { ComponentRegistrations } from '@ngx-formbar/examples';

export const componentRegistrations: ComponentRegistrations = {
  text: () =>
    import('../components/text/text-control.component').then(
      (m) => m.TextControlComponent,
    ),
  number: () =>
    import('../components/number/number-control.component').then(
      (m) => m.NumberControlComponent,
    ),
  checkbox: () =>
    import('../components/checkbox/checkbox-control.component').then(
      (m) => m.CheckboxControlComponent,
    ),
  radio: () =>
    import('../components/radio/radio-control.component').then(
      (m) => m.RadioControlComponent,
    ),
  dropdown: () =>
    import('../components/dropdown/dropdown-control.component').then(
      (m) => m.DropdownControlComponent,
    ),
  group: () =>
    import('../components/group/group-control.component').then(
      (m) => m.GroupControlComponent,
    ),
  note: () =>
    import('../components/note/note-control.component').then(
      (m) => m.NoteControlComponent,
    ),
  textarea: () =>
    import('../components/textarea/textarea-control.component').then(
      (m) => m.TextareaControlComponent,
    ),
  date: () =>
    import('../components/date/date-control.component').then(
      (m) => m.DateControlComponent,
    ),
  file: () =>
    import('../components/file/file-control.component').then(
      (m) => m.FileControlComponent,
    ),
};
