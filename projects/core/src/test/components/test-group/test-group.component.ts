import { Component, inject, Signal, Type } from '@angular/core';
import {
  controlContainerViewProviders,
  NgxFwContent,
  NgxfwGroupDirective,
  ngxfwGroupHostDirective,
} from '../../../lib';
import { TestGroup } from '../../types/group.type';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfwAbstractControlDirective } from '../../../lib/directives/ngxfw-abstract-control.directive';

@Component({
  selector: 'ngxfw-test-group',
  imports: [NgxfwAbstractControlDirective, ReactiveFormsModule],
  templateUrl: './test-group.component.html',
  viewProviders: controlContainerViewProviders,
  hostDirectives: [ngxfwGroupHostDirective],
})
export class TestGroupComponent {
  private readonly control = inject(NgxfwGroupDirective<TestGroup>);

  readonly content: Signal<TestGroup> = this.control.content;
  readonly testId: Signal<string> = this.control.testId;
  readonly controls: Signal<NgxFwContent[]> = this.control.controls;
  readonly registrations: Signal<Map<string, Type<unknown>>> =
    this.control.registrations;
  readonly isHidden: Signal<unknown> = this.control.isHidden;

  get formGroup() {
    return this.control.formGroup;
  }
}
