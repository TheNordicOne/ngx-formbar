import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  TextControlComponent,
  NumberControlComponent,
  CheckboxControlComponent,
  RadioControlComponent,
  DropdownControlComponent,
  TextareaControlComponent,
  DateControlComponent,
  FileControlComponent,
  NoteControlComponent,
  GroupControlComponent,
} from '@ngx-formbar/examples/reactive-forms';

function flattenFormValue(
  value: Record<string, unknown>,
  prefix = '',
): { path: string; value: unknown }[] {
  const entries: { path: string; value: unknown }[] = [];

  for (const [key, val] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof File)) {
      entries.push(...flattenFormValue(val as Record<string, unknown>, path));
    } else {
      entries.push({ path, value: val });
    }
  }

  return entries;
}

@Component({
  selector: 'ngxfb-direct-form-host',
  imports: [
    ReactiveFormsModule,
    TextControlComponent,
    NumberControlComponent,
    CheckboxControlComponent,
    RadioControlComponent,
    DropdownControlComponent,
    TextareaControlComponent,
    DateControlComponent,
    FileControlComponent,
    NoteControlComponent,
    GroupControlComponent,
  ],
  templateUrl: './direct-form-host.component.html',
  styleUrl: './direct-form-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectFormHostComponent {
  readonly form = new FormGroup({
    firstName: new FormControl(''),
    age: new FormControl<number | null>(null),
    agree: new FormControl(false),
    favoriteColor: new FormControl(''),
    country: new FormControl(''),
    bio: new FormControl(''),
    birthDate: new FormControl(''),
    attachment: new FormControl<File | null>(null),
    address: new FormGroup({
      street: new FormControl(''),
      city: new FormControl(''),
    }),
  });

  readonly colorOptions = [
    { id: 'red', value: 'red', label: 'Red' },
    { id: 'green', value: 'green', label: 'Green' },
    { id: 'blue', value: 'blue', label: 'Blue' },
  ];

  readonly countryOptions = [
    { id: 'us', value: 'us', label: 'United States' },
    { id: 'uk', value: 'uk', label: 'United Kingdom' },
    { id: 'de', value: 'de', label: 'Germany' },
  ];

  readonly formValues = signal<{ path: string; value: unknown }[]>([]);

  onSubmit(): void {
    const formValue = this.form.getRawValue() as Record<string, unknown>;
    this.formValues.set(flattenFormValue(formValue));
  }
}
