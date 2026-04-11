import {
  computed,
  Directive,
  effect,
  inject,
  input,
  ViewContainerRef,
} from '@angular/core';
import {
  NGX_FW_COMPONENT_RESOLVER,
  NgxFbAbstractControl,
  NgxFbBaseContent,
} from '@ngx-formbar/core';
import { withHiddenState } from '../composables/hidden.state';
import { FormConfigEntry } from '../types/control-component.type';
import { withLoadedComponent } from '../composables/loaded-component';

@Directive({
  selector: '[ngxfbAbstractControl]',
})
export class NgxfbAbstractControlDirective<T extends NgxFbBaseContent> {
  private viewContainerRef = inject(ViewContainerRef);
  private readonly contentRegistrationService = inject(
    NGX_FW_COMPONENT_RESOLVER,
  );

  readonly config = input.required({
    alias: 'ngxfbAbstractControl',
    transform: (v: [string, T]): FormConfigEntry<T> => ({
      name: v[0],
      config: v[1],
    }),
  });

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

  readonly isHidden = withHiddenState(this.controlConfig);

  private readonly hideStrategy = computed(() => {
    const content = this.controlConfig();
    if ('hideStrategy' in content) {
      return (content as NgxFbAbstractControl).hideStrategy;
    }
    return undefined;
  });

  private readonly handleVisibility = computed(
    () => (this.registrationEntry()?.visibilityHandling ?? 'auto') === 'auto',
  );

  private readonly shouldStructurallyHide = computed(
    () =>
      this.handleVisibility() &&
      this.hideStrategy() === 'remove' &&
      this.isHidden(),
  );

  constructor() {
    effect(() => {
      const component = this.component();
      const shouldHide = this.shouldStructurallyHide();

      this.viewContainerRef.clear();

      if (component && !shouldHide) {
        const componentRef = this.viewContainerRef.createComponent(component);
        componentRef.setInput('content', this.controlConfig());
        componentRef.setInput('name', this.controlName());
      }
    });
  }
}
