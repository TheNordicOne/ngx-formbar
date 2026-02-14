import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { CheckboxControl } from './checkbox-control.type';
import { ngxfbControlHostDirective, viewProviders } from '../../helper';

@Component({
  selector: 'docs-checkbox-control',
  imports: [ReactiveFormsModule],
  templateUrl: './checkbox-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbControlHostDirective],
})
export class CheckboxControlComponent {
  private readonly control = inject(NgxfbControlDirective<CheckboxControl>);

  protected readonly content = this.control.content;
  protected readonly name = this.control.name;
  protected readonly isHidden = this.control.isHidden;
  protected readonly label = computed(() => this.content().label);
}
