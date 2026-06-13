import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { NgxFbForm } from '@ngx-formbar/core';
import { NgxfbFormComponent } from '@ngx-formbar/reactive-forms';

let nextFormId = 0;

@Component({
  selector: 'ngxfb-story-form-host',
  imports: [ReactiveFormsModule, NgxfbFormComponent],
  templateUrl: './story-form-host.component.html',
  styleUrl: './story-form-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryFormHostComponent {
  static lastInstance: StoryFormHostComponent | null = null;

  // Unique per instance so the submit button's `form` attribute binds to this
  // host's form, not another story rendered on the same autodocs page.
  readonly formId = `ngxfb-story-form-${nextFormId++}`;

  private readonly formBuilder = inject(FormBuilder);
  private readonly formRef = viewChild.required(NgxfbFormComponent);

  readonly formConfig = input.required<NgxFbForm>();
  readonly patchData = input<Record<string, unknown>>({});
  readonly autoUpdate = input(false);
  readonly formValues = signal<{ path: string; value: unknown }[]>([]);
  readonly valueHistory = signal<{ timestamp: string; raw: string }[]>([]);

  form: FormGroup = this.formBuilder.group({});

  constructor() {
    StoryFormHostComponent.lastInstance = this;

    this.form.statusChanges
      .pipe(
        filter(() => this.autoUpdate()),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.onSubmit();
      });

    this.form.valueChanges
      .pipe(
        filter(() => this.autoUpdate()),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const raw = JSON.stringify(this.form.getRawValue());
        const timestamp = new Date().toISOString().slice(11, 23);
        this.valueHistory.update((h) => [...h, { timestamp, raw }]);
      });
  }

  reset(): void {
    this.form.reset();
  }

  patchValue(): void {
    // Route through the form's load(), which grows configured arrays to match
    // the data before patching. For array-free configs this behaves like a
    // plain patchValue.
    this.formRef().load(this.patchData());
  }

  onSubmit(): void {
    const formValue = this.form.getRawValue() as Record<string, unknown>;
    this.formValues.set(this.flattenFormValues(formValue));
  }

  private flattenFormValues(
    obj: object,
    parentPath = '',
  ): { path: string; value: unknown }[] {
    let result: { path: string; value: unknown }[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const path = parentPath ? `${parentPath}.${key}` : key;
      const isPlainObject =
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value);
      const isObjectArray =
        Array.isArray(value) &&
        value.some((v) => v !== null && typeof v === 'object');

      if (isPlainObject) {
        result = result.concat(this.flattenFormValues(value as object, path));
        continue;
      }

      if (isObjectArray) {
        result.push({ path, value: JSON.stringify(value) });
        continue;
      }

      result.push({ path, value });
    }

    return result;
  }
}
