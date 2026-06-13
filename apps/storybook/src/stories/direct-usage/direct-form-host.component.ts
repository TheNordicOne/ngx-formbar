import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
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
  ArrayControlComponent,
} from '@ngx-formbar/examples/reactive-forms';

function flattenFormValue(
  value: Record<string, unknown>,
  prefix = '',
): { path: string; value: unknown }[] {
  const entries: { path: string; value: unknown }[] = [];

  for (const [key, val] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const isPlainObject =
      val !== null &&
      typeof val === 'object' &&
      !Array.isArray(val) &&
      !(val instanceof File);
    const isObjectArray =
      Array.isArray(val) &&
      val.some((v) => v !== null && typeof v === 'object');

    if (isPlainObject) {
      entries.push(...flattenFormValue(val as Record<string, unknown>, path));
    } else if (isObjectArray) {
      entries.push({ path, value: JSON.stringify(val) });
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
    ArrayControlComponent,
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
    tags: new FormArray<FormControl<string | null>>([]),
    contacts: new FormArray<
      FormGroup<{
        name: FormControl<string | null>;
        email: FormControl<string | null>;
      }>
    >([]),
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

  readonly newTag = (): FormControl<string | null> =>
    new FormControl<string | null>('');

  readonly newContact = (): FormGroup<{
    name: FormControl<string | null>;
    email: FormControl<string | null>;
  }> =>
    new FormGroup({
      name: new FormControl<string | null>(''),
      email: new FormControl<string | null>(''),
    });

  asFormControl(control: AbstractControl): FormControl<string | null> {
    return control as FormControl<string | null>;
  }

  asContactGroup(control: AbstractControl): FormGroup<{
    name: FormControl<string | null>;
    email: FormControl<string | null>;
  }> {
    return control as FormGroup<{
      name: FormControl<string | null>;
      email: FormControl<string | null>;
    }>;
  }

  onSubmit(): void {
    const formValue = this.form.getRawValue() as Record<string, unknown>;
    this.formValues.set(flattenFormValue(formValue));
  }
}
