import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { NumberControl } from '@ngx-formbar/examples';
import { ngxfbControlHostDirective, viewProviders } from '../../helpers';

@Component({
  selector: 'ngxfb-examples-number-control',
  imports: [ReactiveFormsModule, KeyValuePipe],
  templateUrl: './number-control.component.html',
  styleUrl: './number-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbControlHostDirective],
})
export class NumberControlComponent {
  private readonly control = inject(NgxfbControlDirective<NumberControl>);

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
  protected readonly min = computed(() => this.content().min);
  protected readonly max = computed(() => this.content().max ?? null);
  protected get errors() {
    return this.control.formControl?.errors ?? {};
  }

  protected get formControl() {
    return this.control.formControl;
  }
}
