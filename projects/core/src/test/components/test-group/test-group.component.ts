import { Component, effect, inject, Signal } from '@angular/core';
import { NgxFbContent } from '../../../lib';
import { TestGroup } from '../../types/group.type';
import { ReactiveFormsModule } from '@angular/forms';
import { controlContainerViewProviders } from '../../../lib/helper/control-container-view-providers';
import { simpleTestIdBuilder } from '../../helper/test-id-builder';
import { ngxfbGroupHostDirective } from '../../../lib/helper/ngxfb-group-host-directive';
import { NgxfbGroupDirective } from '../../../lib/directives/ngxfb-group.directive';
import { NgxfbAbstractControlDirective } from '../../../lib/directives/ngxfb-abstract-control.directive';

@Component({
  selector: 'ngxfb-test-group',
  imports: [NgxfbAbstractControlDirective, ReactiveFormsModule],
  templateUrl: './test-group.component.html',
  viewProviders: controlContainerViewProviders,
  hostDirectives: [ngxfbGroupHostDirective],
})
export class TestGroupComponent {
  private readonly control = inject(NgxfbGroupDirective<TestGroup>);

  readonly content: Signal<TestGroup> = this.control.content;
  readonly name: Signal<string> = this.control.name;
  readonly testId: Signal<string> = this.control.testId;
  readonly controls: Signal<[string, NgxFbContent][]> = this.control.controls;

  readonly isHidden: Signal<unknown> = this.control.isHidden;
  readonly dynamicTitle: Signal<string | undefined> = this.control.dynamicTitle;

  get formGroup() {
    return this.control.formGroup;
  }

  constructor() {
    effect(() => {
      const useDefaultTestId = this.control.content().useDefaultTestId;
      this.control.setTestIdBuilderFn(
        useDefaultTestId ? undefined : simpleTestIdBuilder,
      );
    });
  }
}
