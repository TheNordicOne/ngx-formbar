import { Component, computed, input } from '@angular/core';

import { TestTextControl } from '../../types/controls.type';

@Component({
  selector: 'ngxfw-test-text-control',
  imports: [],
  templateUrl: './test-text-control.component.html',
})
export class TestTextControlComponent {
  readonly content = input<TestTextControl>();

  readonly testId = computed(() => {
    const control = this.content();
    if (!control || !control.id) {
      return 'control';
    }
    return `control-${control.id}`;
  });
}
