import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  controlContainerViewProviders,
  ReactiveFormbarControl,
} from '@ngx-formbar/reactive-forms';
import { NgxFbControl } from '@ngx-formbar/core';

export interface LayoutField extends NgxFbControl {
  type: 'field';
  placeHolder?: string;
}

/**
 * Minimal control used only by the styling guide demo. Its host is a plain
 * grid cell, so a layout on the form arranges each field as a single item.
 */
@Component({
  selector: 'docs-styling-field',
  imports: [ReactiveFormsModule],
  templateUrl: './layout-field.component.html',
  styleUrl: './layout-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: controlContainerViewProviders,
})
export class LayoutFieldComponent implements ReactiveFormbarControl<LayoutField> {
  readonly name = input.required<string>();
  readonly labelText = input<string | undefined>('');
  readonly placeHolder = input<string>();
}
