import { Component, inject, Signal, Type } from '@angular/core';
import { ContentHostComponent } from '../../../lib/components/content-host/content-host.component';
import { ngxfwGroupHostDirective } from '../../../lib/helper/ngxfw-group-host-directive';
import { NgxfwGroupDirective } from '../../../lib/directives/ngxfw-group.directive';
import { TestGroup } from '../../types/group.type';
import { NgxFwContent } from '../../../lib';
import { ReactiveFormsModule } from '@angular/forms';
import { controlContainerViewProviders } from '../../../lib/helper/control-container-view-providers';

@Component({
  selector: 'ngxfw-test-group',
  imports: [ContentHostComponent, ReactiveFormsModule],
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

  get groupInstance() {
    return this.control.group;
  }
}
