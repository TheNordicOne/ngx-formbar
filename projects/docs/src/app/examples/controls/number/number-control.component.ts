import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { NumberControl } from './number-control.type';
import { ngxfbControlHostDirective, viewProviders } from '../../helper';

@Component({
  selector: 'docs-number-control',
  imports: [ReactiveFormsModule],
  templateUrl: './number-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbControlHostDirective],
})
export class NumberControlComponent {
  private readonly control = inject(NgxfbControlDirective<NumberControl>);

  protected readonly content = this.control.content;
  protected readonly name = this.control.name;
  protected readonly isHidden = this.control.isHidden;
  protected readonly label = computed(() => this.content().label);
  protected readonly min = computed(() => this.content().min);
  protected readonly max = computed(() => this.content().max ?? null);
}
