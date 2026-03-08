import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { TextareaControl } from '@ngx-formbar/examples';
import { ngxfbControlHostDirective, viewProviders } from '../../helpers';

@Component({
  selector: 'ngxfb-examples-textarea-control',
  imports: [ReactiveFormsModule, KeyValuePipe],
  templateUrl: './textarea-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbControlHostDirective],
})
export class TextareaControlComponent {
  private readonly control = inject(NgxfbControlDirective<TextareaControl>);

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
  protected readonly placeholder = computed(() => this.content().placeHolder);
  protected readonly rows = computed(() => this.content().rows);
  protected readonly maxLength = computed(
    () => this.content().maxLength ?? null,
  );
  protected readonly errors = computed(
    () => this.control.formControl?.errors ?? {},
  );

  protected get formControl() {
    return this.control.formControl;
  }
}
