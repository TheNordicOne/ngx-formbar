import { afterRenderEffect, Directive, input } from '@angular/core';
import {
  FormConfigEntry,
  NgxFbBlock,
  toSignalMap,
  withBase,
  withComponentHost,
  withHiddenState,
  withTestId,
} from '@ngx-formbar/core';
import { FormbarBlock } from '../types/control-component.type';

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

  private readonly signalMap = toSignalMap<FormbarBlock>({
    isHidden: this.isHidden,
    testId: this.testId,
  });

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
