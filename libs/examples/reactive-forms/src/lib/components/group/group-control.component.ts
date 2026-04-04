import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbAbstractControlDirective, NgxfbGroupDirective } from '@ngx-formbar/reactive-forms';
import { GroupControl } from '@ngx-formbar/examples'; 
import { ngxfbGroupHostDirective, viewProviders } from '../../helpers';
import { ValidationErrorsComponent } from '../validation-errors/validation-errors.component';

@Component({
  selector: 'ngxfb-examples-group-control',
  imports: [ReactiveFormsModule, NgxfbAbstractControlDirective, ValidationErrorsComponent],
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
  protected get errors() {
    return this.group.formGroup?.errors ?? {};
  }
  protected get dirty() {
    return this.group.formGroup?.dirty ?? false;
  }

  protected get formGroup() {
    return this.group.formGroup;
  }
}
