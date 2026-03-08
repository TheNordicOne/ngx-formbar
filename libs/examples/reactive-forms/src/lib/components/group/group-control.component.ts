import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbGroupDirective } from '@ngx-formbar/reactive-forms';
import { NgxfbAbstractControlDirective } from '@ngx-formbar/core';
import { GroupControl } from '@ngx-formbar/examples';
import { ngxfbGroupHostDirective, viewProviders } from '../../helpers';

@Component({
  selector: 'ngxfb-examples-group-control',
  imports: [ReactiveFormsModule, NgxfbAbstractControlDirective, KeyValuePipe],
  templateUrl: './group-control.component.html',
  styleUrl: './group-control.component.scss',
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
  protected readonly testId = this.group.testId;
  protected readonly dynamicTitle = this.group.dynamicTitle;
  protected readonly legend = computed(
    () => this.dynamicTitle() ?? this.content().legend ?? '',
  );
  protected readonly errors = computed(
    () => this.group.formGroup?.errors ?? {},
  );

  protected get formGroup() {
    return this.group.formGroup;
  }
}
