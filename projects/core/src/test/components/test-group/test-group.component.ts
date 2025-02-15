import { Component, computed, input } from '@angular/core';
import { NgxFwFormGroup } from '../../../lib/types/content.type';

@Component({
  selector: 'ngxfw-test-group',
  imports: [],
  templateUrl: './test-group.component.html',
})
export class TestGroupComponent {
  readonly content = input<NgxFwFormGroup>();
  readonly testId = computed(() => {
    const group = this.content();
    if (!group || !group.id) {
      return 'group';
    }
    return `group-${group.id}`;
  });
}
