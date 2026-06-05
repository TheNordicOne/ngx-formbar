import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  TemplateRef,
  viewChildren,
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
  NGXFB_ARRAY_CONTROL,
  NgxFbFormArrayOutlet,
  ReactiveFormbarArray,
} from '@ngx-formbar/reactive-forms';
import { viewProviders } from '../../helpers';
import { ValidationErrorsComponent } from '../validation-errors/validation-errors.component';
import { ArrayControl } from '@ngx-formbar/examples';

@Component({
  selector: 'ngxfb-examples-array-control',
  imports: [
    ReactiveFormsModule,
    ValidationErrorsComponent,
    NgxFbFormArrayOutlet,
    NgTemplateOutlet,
  ],
  templateUrl: './array-control.component.html',
  styleUrl: './array-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
})
export class ArrayControlComponent
  implements ReactiveFormbarArray<ArrayControl>
{
  private readonly parent = inject(ControlContainer);
  // Present when rendered through formbar; absent when the component is used
  // standalone with a manual #item template.
  private readonly arrayContext = inject(NGXFB_ARRAY_CONTROL, {
    optional: true,
  });
  private readonly injector = inject(Injector);

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
  readonly addLabel = input<string>();
  readonly itemLabel = input<string>();
  readonly emptyMessage = input<string>();

  readonly itemTemplate = contentChild('item', { read: TemplateRef });

  // Remove buttons of the rendered rows; used to restore focus after a row is
  // removed so keyboard users are not dropped to the document body.
  private readonly removeButtons =
    viewChildren<ElementRef<HTMLButtonElement>>('removeButton');

  readonly formArray = computed(() => {
    const control = this.parent.control?.get(this.name());
    return control instanceof FormArray ? control : null;
  });

  readonly controls = computed<AbstractControl[]>(
    () => this.arrayContext?.rows() ?? this.formArray()?.controls ?? [],
  );

  readonly displayLabel = computed(() => {
    const dynamic = this.dynamicLabel();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }
    return this.labelText();
  });

  readonly announcement = signal('');

  add(): void {
    if (this.arrayContext) {
      this.arrayContext.add();
    } else {
      this.formArray()?.push(this.itemFactory()());
    }
    this.announce('added');
  }

  insertAt(index: number): void {
    if (this.arrayContext) {
      this.arrayContext.insertAt(index);
    } else {
      this.formArray()?.insert(index, this.itemFactory()());
    }
    this.announce('added');
  }

  removeAt(index: number): void {
    if (this.arrayContext) {
      this.arrayContext.removeAt(index);
    } else {
      this.formArray()?.removeAt(index);
    }
    this.announce('removed');
    this.focusAfterRemoval(index);
  }

  move(from: number, to: number): void {
    this.moveInArray(from, to);
  }

  private moveInArray(from: number, to: number): void {
    const array = this.formArray();
    if (!array) {
      return;
    }
    const count = array.length;
    if (from === to || from < 0 || from >= count || to < 0 || to >= count) {
      return;
    }
    const row = array.at(from);
    array.removeAt(from);
    array.insert(to, row);
  }

  // After a row leaves the DOM, move focus to the remove button now sitting at
  // the removed slot (or the last one when the tail was removed) so keyboard
  // users keep their place. afterNextRender fires once the @for has restamped.
  private focusAfterRemoval(removedIndex: number): void {
    afterNextRender(
      () => {
        const buttons = this.removeButtons();
        if (buttons.length === 0) {
          return;
        }
        const target = buttons[Math.min(removedIndex, buttons.length - 1)];
        target.nativeElement.focus();
      },
      { injector: this.injector },
    );
  }

  private announce(action: 'added' | 'removed'): void {
    const count = this.controls().length;
    const noun = this.itemLabel() ?? 'item';
    this.announcement.set(`${noun} ${action}. ${String(count)} total.`);
  }
}
