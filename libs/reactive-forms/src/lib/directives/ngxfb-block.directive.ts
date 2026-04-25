import {
  afterRenderEffect,
  ComponentRef,
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  Signal,
  ViewContainerRef,
} from '@angular/core';
import {
  isFormbarBlock,
  NGX_FW_COMPONENT_RESOLVER,
  NgxFbBlock,
} from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { withLoadedComponent } from '../composables/loaded-component';
import { createBindings } from '../setup/bindings';

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

  private readonly registrationEntry = computed(() => {
    const registrations = this.registrations();
    const content = this.controlConfig();
    return registrations.get(content.type) ?? null;
  });

  readonly component = withLoadedComponent(this.registrationEntry);

  constructor() {
    afterRenderEffect(() => {
      const component = this.component();

      this.viewContainerRef.clear();

      if (!component) {
        return;
      }

      if (!isFormbarBlock(this.controlConfig)) {
        return;
      }

      const signalMap = new Map<string, Signal<unknown>>();
      const bindings = createBindings(component, signalMap, this.controlConfig);

      this.componentRef = this.viewContainerRef.createComponent(component, {
        bindings: [...bindings],
      });
    });

    this.destroyRef.onDestroy(() => {
      this.componentRef?.destroy();
    });
  }
}
