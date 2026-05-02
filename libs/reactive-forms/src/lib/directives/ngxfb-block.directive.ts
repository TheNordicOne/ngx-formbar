import { afterRenderEffect, Directive, input, Signal } from '@angular/core';
import { NgxFbBlock } from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { withHiddenState } from '../composables/hidden.state';
import { withTestId } from '../composables/testId';
import { withBase } from '../composables/base';
import { withComponentHost } from '../composables/component-host';

@Directive({
  selector: '[ngxfbBlock]',
})
export class NgxfbBlockDirective {
  readonly config = input.required<FormConfigEntry<NgxFbBlock>>({
    alias: 'ngxfbBlock',
  });

  private readonly base = withBase(this.config);
  private readonly controlConfig = this.base.controlConfig;
  private readonly controlName = this.base.controlName;

  private readonly isHidden = withHiddenState(this.controlConfig);

  private readonly testId = withTestId(this.controlConfig, this.controlName);

  private readonly signalMap = new Map<string, Signal<unknown>>([
    ['isHidden', this.isHidden],
    ['testId', this.testId],
  ]);

  private readonly host = withComponentHost({
    signalMap: this.signalMap,
    controlConfig: this.controlConfig,
  });

  constructor() {
    afterRenderEffect(() => {
      const component = this.base.component();

      this.host.clear();

      if (!component) {
        return;
      }

      this.host.mount(component);
    });
  }
}
