import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { RadioControl } from './radio-control.type';
import { ngxfbControlHostDirective, viewProviders } from '../../helper';

@Component({
  selector: 'docs-radio-control',
  imports: [ReactiveFormsModule],
  templateUrl: './radio-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbControlHostDirective],
})
export class RadioControlComponent {
  private readonly control = inject(NgxfbControlDirective<RadioControl>);

  protected readonly content = this.control.content;
  protected readonly name = this.control.name;
  protected readonly isHidden = this.control.isHidden;
  protected readonly label = computed(() => this.content().label);
  protected readonly options = computed(() => this.content().options);
}
