import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { DateControl } from '@ngx-formbar/examples';
import { ngxfbControlHostDirective, viewProviders } from '../../helpers';
import { ValidationErrorsComponent } from '../validation-errors/validation-errors.component';

@Component({
  selector: 'ngxfb-examples-date-control',
  imports: [ReactiveFormsModule, ValidationErrorsComponent],
  templateUrl: './date-control.component.html',
  styleUrl: './date-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbControlHostDirective],
})
export class DateControlComponent {
  private readonly control = inject(NgxfbControlDirective<DateControl>);

  protected readonly content = this.control.content;
  protected readonly name = this.control.name;
  protected readonly isHidden = this.control.isHidden;
  protected readonly testId = this.control.testId;
  protected readonly disabled = this.control.disabled;
  protected readonly readonly = this.control.readonly;
  protected readonly dynamicLabel = this.control.dynamicLabel;
  protected readonly label = computed(
    () => this.dynamicLabel() ?? this.content().label,
  );
  protected readonly minDate = computed(() => this.content().minDate);
  protected readonly maxDate = computed(() => this.content().maxDate);
  protected get errors() {
    return this.control.formControl?.errors ?? {};
  }
  protected get dirty() {
    return this.control.formControl?.dirty ?? false;
  }

  protected get formControl() {
    return this.control.formControl;
  }
}
