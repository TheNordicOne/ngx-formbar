import { Component, computed, effect, inject, Signal } from '@angular/core';
import { controlContainerViewProviders } from '../../../lib/helper/control-container-view-providers';
import { NgxfwBlockDirective } from '../../../lib';
import { InfoBlock } from '../../types/block.type';
import { simpleTestIdBuilder } from '../../helper/test-id-builder';

@Component({
  selector: 'ngxfw-test-block',
  imports: [],
  templateUrl: './test-block.component.html',
  viewProviders: controlContainerViewProviders,
  hostDirectives: [
    {
      directive: NgxfwBlockDirective,
      inputs: ['content', 'name'],
    },
  ],
})
export class TestBlockComponent {
  private readonly control = inject(NgxfwBlockDirective<InfoBlock>);

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
