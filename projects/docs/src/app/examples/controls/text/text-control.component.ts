import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { TextControl } from './text-control.type';
import { ngxfbControlHostDirective, viewProviders } from '../../helper';

@Component({
  selector: 'docs-text-control',
  imports: [ReactiveFormsModule],
  templateUrl: './text-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbControlHostDirective],
})
export class TextControlComponent {
  private readonly control = inject(NgxfbControlDirective<TextControl>);

  protected readonly content = this.control.content;
  protected readonly name = this.control.name;
  protected readonly isHidden = this.control.isHidden;
  protected readonly label = computed(() => this.content().label);
  protected readonly hint = computed(() => this.content().hint);
  protected readonly placeholder = computed(() => this.content().placeHolder);
}
