import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { DropdownControl } from '@ngx-formbar/examples';
import { ngxfbControlHostDirective, viewProviders } from '../../helpers';
import { ValidationErrorsComponent } from '../validation-errors/validation-errors.component';

@Component({
  selector: 'ngxfb-examples-dropdown-control',
  imports: [ReactiveFormsModule, ValidationErrorsComponent],
  templateUrl: './dropdown-control.component.html',
  styleUrl: './dropdown-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbControlHostDirective],
})
export class DropdownControlComponent {
  private readonly control = inject(NgxfbControlDirective<DropdownControl>);

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
  protected readonly options = computed(() => this.content().options);
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
