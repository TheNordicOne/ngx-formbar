import { inject, Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import {
  isFormbarArray,
  isFormbarGroup,
  NgxFbArray,
  NgxFbForm,
  NgxFbItem,
} from '@ngx-formbar/core';
import { RowFactoryService } from './row-factory.service';

/**
 * Loads a value into a formbar-built reactive form. Angular's `patchValue`
 * cannot grow a `FormArray` (it ignores items past the current length), so
 * this service first sizes every array in the config tree to match the
 * incoming data, building missing rows with {@link RowFactoryService}, then
 * applies the value with a single `patchValue`.
 *
 * The consumer keeps owning the root `FormGroup` and reads it through the
 * standard Angular API; this only handles the array-growing that Angular
 * leaves to the caller.
 */
@Injectable({ providedIn: 'root' })
export class FormLoaderService {
  private readonly rowFactory = inject(RowFactoryService);

  load(root: FormGroup, config: NgxFbForm, data: Record<string, unknown>): void {
    this.sizeRecord(config.content, root, data);
    root.patchValue(data);
  }

  private sizeRecord(
    configRecord: Record<string, NgxFbItem>,
    group: FormGroup,
    data: unknown,
  ): void {
    const values = isRecord(data) ? data : {};
    for (const [name, node] of Object.entries(configRecord)) {
      const control = group.get(name);
      if (!control) {
        continue;
      }
      this.sizeNode(node, control, values[name]);
    }
  }

  private sizeNode(node: NgxFbItem, control: AbstractControl, value: unknown) {
    if (isFormbarArray(node) && control instanceof FormArray) {
      this.sizeArray(node, control, value);
      return;
    }
    if (isFormbarGroup(node) && control instanceof FormGroup) {
      this.sizeRecord(node.controls, control, value);
    }
  }

  private sizeArray(node: NgxFbArray, array: FormArray, value: unknown): void {
    const target = Array.isArray(value) ? value.length : 0;

    while (array.length < target) {
      array.push(this.rowFactory.build(node.rowControl));
    }
    while (array.length > target) {
      array.removeAt(array.length - 1);
    }

    if (!Array.isArray(value)) {
      return;
    }
    array.controls.forEach((row, index) => {
      this.sizeNode(node.rowControl, row, value[index]);
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
