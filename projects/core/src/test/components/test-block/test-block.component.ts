import { Component, computed, effect, inject, Signal } from '@angular/core';
import { controlContainerViewProviders } from '../../../lib/helper/control-container-view-providers';
import { InfoBlock } from '../../types/block.type';
import { simpleTestIdBuilder } from '../../helper/test-id-builder';
import { NgxfbBlockDirective } from '../../../lib/directives/ngxfw-block.directive';

@Component({
  selector: 'ngxfb-test-block',
  imports: [],
  templateUrl: './test-block.component.html',
  viewProviders: controlContainerViewProviders,
  hostDirectives: [
    {
      directive: NgxfbBlockDirective,
      inputs: ['content', 'name'],
    },
  ],
})
export class TestBlockComponent {
  private readonly control = inject(NgxfbBlockDirective<InfoBlock>);

  readonly content: Signal<InfoBlock> = this.control.content;
  readonly testId: Signal<string> = this.control.testId;
  readonly rootForm = this.control.rootForm;

  readonly message = computed(() => this.content().message);

  constructor() {
    effect(() => {
      const useDefaultTestId = this.control.content().useDefaultTestId;
      this.control.setTestIdBuilderFn(
        useDefaultTestId ? undefined : simpleTestIdBuilder,
      );
    });
  }
}
