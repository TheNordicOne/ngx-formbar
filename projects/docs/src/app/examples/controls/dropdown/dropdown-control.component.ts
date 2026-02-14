import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { DropdownControl } from './dropdown-control.type';
import { ngxfbControlHostDirective, viewProviders } from '../../helper';

@Component({
  selector: 'docs-dropdown-control',
  imports: [ReactiveFormsModule],
  templateUrl: './dropdown-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbControlHostDirective],
})
export class DropdownControlComponent {
  private readonly control = inject(NgxfbControlDirective<DropdownControl>);

  protected readonly content = this.control.content;
  protected readonly name = this.control.name;
  protected readonly isHidden = this.control.isHidden;
  protected readonly label = computed(() => this.content().label);
  protected readonly options = computed(() => this.content().options);
}
