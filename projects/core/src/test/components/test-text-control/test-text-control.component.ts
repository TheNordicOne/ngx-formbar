import { Component, effect, inject, Signal } from '@angular/core';

import { NgxfwControlDirective } from '../../../lib';
import { TestTextControl } from '../../types/controls.type';
import { ReactiveFormsModule } from '@angular/forms';
import { controlContainerViewProviders } from '../../../lib/helper/control-container-view-providers';
import { ngxfwControlHostDirective } from '../../../lib/helper/ngxfw-control-host-directive';
import { simpleTestIdBuilder } from '../../helper/test-id-builder';

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
  readonly isHidden: Signal<unknown> = this.control.isHidden;
  readonly disabled: Signal<boolean> = this.control.disabled;
  readonly readonly: Signal<boolean> = this.control.readonly;
  readonly dynamicLabel: Signal<string | undefined> = this.control.dynamicLabel;

  get formControl() {
    return this.control.formControl;
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
