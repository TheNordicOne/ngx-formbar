import {
  afterRenderEffect,
  ComponentRef,
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  Signal,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { NGX_FW_COMPONENT_RESOLVER, NgxFbBlock } from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { withLoadedComponent } from '../composables/loaded-component';
import { createBindings } from '../setup/bindings';
import { withHiddenState } from '../composables/hidden.state';
import { withTestId } from '../composables/testId';

@Directive({
  selector: '[ngxfbBlock]',
})
export class NgxfbBlockDirective {
  private viewContainerRef = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);

  private readonly contentRegistrationService = inject(
    NGX_FW_COMPONENT_RESOLVER,
  );

  readonly config = input.required<FormConfigEntry<NgxFbBlock>>({
    alias: 'ngxfbBlock',
  });

  private componentRef?: ComponentRef<unknown>;

  private readonly registrations =
    this.contentRegistrationService.registrations;

  private readonly controlConfig = computed(() => this.config().config);
  private readonly controlName = computed(() => this.config().name);

  private readonly registrationEntry = computed(() => {
    const registrations = this.registrations();
    const content = this.controlConfig();
    return registrations.get(content.type) ?? null;
  });

  readonly component = withLoadedComponent(this.registrationEntry);

  private readonly isHidden = withHiddenState(this.controlConfig);

  private readonly testId = withTestId(this.controlConfig, this.controlName);

  private readonly signalMap = new Map<string, Signal<unknown>>([
    ['isHidden', this.isHidden],
    ['testId', this.testId],
  ]);

  constructor() {
    afterRenderEffect(() => {
      const component = this.component();

      this.viewContainerRef.clear();

      if (!component) {
        return;
      }

      this.instantiateComponent(component);
    });

    this.destroyRef.onDestroy(() => {
      this.componentRef?.destroy();
    });
  }

  private instantiateComponent(component: Type<unknown>) {
    const bindings = createBindings(
      component,
      this.signalMap,
      this.controlConfig,
    );

    this.componentRef = this.viewContainerRef.createComponent(component, {
      bindings: [...bindings],
    });
  }
}
