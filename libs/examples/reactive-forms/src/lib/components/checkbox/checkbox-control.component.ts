import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { CheckboxControl } from '@ngx-formbar/examples';
import { ngxfbControlHostDirective, viewProviders } from '../../helpers';
import { ValidationErrorsComponent } from '../validation-errors/validation-errors.component';

@Component({
  selector: 'ngxfb-examples-checkbox-control',
  imports: [ReactiveFormsModule, ValidationErrorsComponent],
  templateUrl: './checkbox-control.component.html',
  styleUrl: './checkbox-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbControlHostDirective],
})
export class CheckboxControlComponent {
  private readonly control = inject(NgxfbControlDirective<CheckboxControl>);

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
