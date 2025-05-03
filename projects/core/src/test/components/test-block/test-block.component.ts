import { Component, computed, inject, Signal } from '@angular/core';
import { controlContainerViewProviders } from '../../../lib/helper/control-container-view-providers';
import { NgxfwBlockDirective } from '../../../lib/directives/ngxfw-block.directive';
import { InfoBlock } from '../../types/block.type';

@Component({
  selector: 'ngxfw-test-block',
  imports: [],
  templateUrl: './test-block.component.html',
  viewProviders: controlContainerViewProviders,
  hostDirectives: [
    {
      directive: NgxfwBlockDirective,
      inputs: ['content'],
    },
  ],
})
export class TestBlockComponent {
  private readonly control = inject(NgxfwBlockDirective<InfoBlock>);

  readonly content: Signal<InfoBlock> = this.control.content;
  readonly testId: Signal<string> = this.control.testId;
  readonly rootForm = this.control.rootForm;

  readonly message = computed(() => this.content().message);
}
