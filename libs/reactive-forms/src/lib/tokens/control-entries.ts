import { InjectionToken, Signal } from '@angular/core';
import { FormConfigEntry, NgxFbItem } from '@ngx-formbar/core';
import { AbstractControl } from '@angular/forms';

export const NGXFB_CONTROL_ENTRIES = new InjectionToken<
  Signal<FormConfigEntry<NgxFbItem>[]>
>('ngxfb-control-entries');

/**
 * Context an array directive exposes to its mounted component and the row
 * outlet. Carries the row shape, the live row controls, and the add/remove
 * operations. The live `FormArray` remains the source of truth; `rows`
 * notifies on structural changes so templates re-render.
 */
export interface NgxFbArrayContext {
  readonly rowControl: Signal<NgxFbItem>;
  readonly rows: Signal<AbstractControl[]>;
  add(): void;
  insertAt(index: number): void;
  removeAt(index: number): void;
  /** Moves the row at `from` to `to`, shifting the rows in between. */
  move(from: number, to: number): void;
}

export const NGXFB_ARRAY_CONTROL = new InjectionToken<NgxFbArrayContext>(
  'ngxfb-array-control',
);
