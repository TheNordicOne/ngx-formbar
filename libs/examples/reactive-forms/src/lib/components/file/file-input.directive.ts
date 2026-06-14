import { Directive, ElementRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type ChangeFn = (value: File[]) => void;
type TouchedFn = () => void;

// Native file inputs are read-only from script, so the form value must flow
// out of the element (selected File[]) rather than being written back into it.
@Directive({
  selector: 'input[type=file][ngxfbFileInput]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: FileInputDirective,
      multi: true,
    },
  ],
  host: {
    '(change)': 'handleChange()',
    '(blur)': 'handleBlur()',
  },
})
export class FileInputDirective implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLInputElement>>(ElementRef);

  private onChange: ChangeFn = () => undefined;
  private onTouched: TouchedFn = () => undefined;

  handleChange(): void {
    const input = this.host.nativeElement;
    this.onChange(Array.from(input.files ?? []));
  }

  handleBlur(): void {
    this.onTouched();
  }

  writeValue(value: File[] | null): void {
    if (value?.length === 0) {
      this.host.nativeElement.value = '';
    }
  }

  registerOnChange(fn: ChangeFn): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: TouchedFn): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.host.nativeElement.disabled = isDisabled;
  }
}
