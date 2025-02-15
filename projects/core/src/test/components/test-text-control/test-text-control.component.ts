import { Component, computed, inject } from '@angular/core';

import { viewProviders } from '../../../lib/helper/view-providers';
import { ngxfwControlHostDirective } from '../../../lib/helper/ngxfw-control-host-directive';
import { NgxfwControlDirective } from '../../../lib';
import { TestTextControl } from '../../types/controls.type';

@Component({
  selector: 'ngxfw-test-text-control',
  imports: [],
  templateUrl: './test-text-control.component.html',
  viewProviders,
  hostDirectives: [ngxfwControlHostDirective],
})
export class TestTextControlComponent {
  private readonly control = inject(NgxfwControlDirective<TestTextControl>);

  readonly content = this.control.content;

  readonly testId = computed(() => {
    const control = this.content();

    if (!control.id) {
      return 'control';
    }
    return `control-${control.id}`;
  });
}
