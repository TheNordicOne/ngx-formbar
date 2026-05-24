import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  AbstractControl,
  ControlContainer,
  FormArray,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import {
  NgxfbControlOutlet,
  ReactiveFormbarControl,
} from '@ngx-formbar/reactive-forms';
import { viewProviders } from '../../helpers';
import { ValidationErrorsComponent } from '../validation-errors/validation-errors.component';
import { ArrayControl } from '../../../../../src/lib/types/array-control.type';

@Component({
  selector: 'ngxfb-examples-array-control',
  imports: [
    ReactiveFormsModule,
    ValidationErrorsComponent,
    NgxfbControlOutlet,
    NgTemplateOutlet,
  ],
  templateUrl: './array-control.component.html',
  styleUrl: './array-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class ArrayControlComponent
  implements ReactiveFormbarControl<ArrayControl>
{
  private readonly parent = inject(ControlContainer);

  readonly name = input.required<string>();
  readonly isDisabled = input(false);
  readonly isReadonly = input(false);
  readonly isHidden = input(false);
  readonly labelText = input<string | undefined>('');
  readonly dynamicLabel = input<string | null>();
  readonly testId = input('');
  readonly errors = input<ValidationErrors | null>(null);
  readonly isDirty = input(false);
  readonly itemFactory = input<() => AbstractControl>(
    () => new FormControl<string | null>(null),
  );

  readonly itemTemplate = contentChild('item', { read: TemplateRef });

  readonly formArray = computed(
    () => this.parent.control?.get(this.name()) as FormArray | null,
  );

  readonly controls = computed(() => this.formArray()?.controls ?? []);

  readonly displayLabel = computed(() => {
    const dynamic = this.dynamicLabel();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }
    return this.labelText();
  });

  add(): void {
    this.formArray()?.push(this.itemFactory()());
  }

  removeAt(index: number): void {
    this.formArray()?.removeAt(index);
  }
}
