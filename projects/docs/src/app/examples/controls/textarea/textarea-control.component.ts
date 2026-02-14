import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { TextareaControl } from './textarea-control.type';
import { ngxfbControlHostDirective, viewProviders } from '../../helper';

@Component({
  selector: 'docs-textarea-control',
  imports: [ReactiveFormsModule],
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
  protected readonly disabled = this.control.disabled;
  protected readonly readonly = this.control.readonly;
  protected readonly label = computed(
    () => this.control.dynamicLabel() ?? this.content().label,
  );
  protected readonly placeholder = computed(() => this.content().placeHolder);
  protected readonly rows = computed(() => this.content().rows);
  protected readonly maxLength = computed(() => this.content().maxLength ?? null);
}
