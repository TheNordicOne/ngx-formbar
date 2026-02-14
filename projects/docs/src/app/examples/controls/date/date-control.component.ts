import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { DateControl } from './date-control.type';
import { ngxfbControlHostDirective, viewProviders } from '../../helper';

@Component({
  selector: 'docs-date-control',
  imports: [ReactiveFormsModule],
  templateUrl: './date-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbControlHostDirective],
})
export class DateControlComponent {
  private readonly control = inject(NgxfbControlDirective<DateControl>);

  protected readonly content = this.control.content;
  protected readonly name = this.control.name;
  protected readonly isHidden = this.control.isHidden;
  protected readonly readonly = this.control.readonly;
  protected readonly label = computed(
    () => this.control.dynamicLabel() ?? this.content().label,
  );
  protected readonly minDate = computed(() => this.content().minDate);
  protected readonly maxDate = computed(() => this.content().maxDate);
}
