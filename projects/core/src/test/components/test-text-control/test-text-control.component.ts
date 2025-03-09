import { Component, inject, Signal } from '@angular/core';

import {
  controlContainerViewProviders,
  NgxfwControlDirective,
  ngxfwControlHostDirective,
} from '../../../lib';
import { TestTextControl } from '../../types/controls.type';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'ngxfw-test-text-control',
  imports: [ReactiveFormsModule],
  templateUrl: './test-text-control.component.html',
  viewProviders: controlContainerViewProviders,
  hostDirectives: [ngxfwControlHostDirective],
})
export class TestTextControlComponent {
  private readonly control = inject(NgxfwControlDirective<TestTextControl>);

  readonly content: Signal<TestTextControl> = this.control.content;
  readonly testId: Signal<string> = this.control.testId;

  get controlInstance() {
    return this.control.control;
  }
}
