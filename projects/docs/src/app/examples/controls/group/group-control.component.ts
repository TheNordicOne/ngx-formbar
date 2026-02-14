import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbGroupDirective } from '@ngx-formbar/reactive-forms';
import { NgxfbAbstractControlDirective } from '@ngx-formbar/core';
import { GroupControl } from './group-control.type';
import { ngxfbGroupHostDirective, viewProviders } from '../../helper';

@Component({
  selector: 'docs-group-control',
  imports: [ReactiveFormsModule, NgxfbAbstractControlDirective],
  templateUrl: './group-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: viewProviders,
  hostDirectives: [ngxfbGroupHostDirective],
})
export class GroupControlComponent {
  private readonly group = inject(NgxfbGroupDirective<GroupControl>);

  protected readonly content = this.group.content;
  protected readonly name = this.group.name;
  protected readonly controls = this.group.controls;
  protected readonly isHidden = this.group.isHidden;
  protected readonly legend = computed(
    () => this.group.dynamicTitle() ?? this.content().legend ?? '',
  );
}
