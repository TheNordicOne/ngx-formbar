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
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { from, of, switchMap } from 'rxjs';
import { withHiddenState } from '../composables/hidden.state';

@Directive({
  selector: '[ngxfbAbstractControl]',
})
export class NgxfbAbstractControlDirective<T extends NgxFbBaseContent> {
  private viewContainerRef = inject(ViewContainerRef);
  private readonly contentRegistrationService = inject(
    NGX_FW_COMPONENT_RESOLVER,
  );

  readonly content = input.required<[string, T]>({
    alias: 'ngxfbAbstractControl',
  });

  readonly controlName = computed(() => this.content()[0]);
  readonly controlConfig = computed(() => this.content()[1]);
  readonly registrations = this.contentRegistrationService.registrations;

  private readonly registrationEntry = computed(() => {
    const registrations = this.registrations();
    const content = this.controlConfig();
    return registrations.get(content.type) ?? null;
  });

  private readonly $registrationEntry = toObservable(this.registrationEntry);
  private readonly $component = this.$registrationEntry.pipe(
    switchMap((entry) => {
      if (!entry) {
        return of(null);
      }
      if ('component' in entry) {
        return of(entry.component);
      }
      return from(entry.loadComponent());
    }),
  );

  readonly component = toSignal(this.$component, { initialValue: null });

  readonly isHidden = withHiddenState(this.controlConfig);

  private readonly hideStrategy = computed(() => {
    const content = this.controlConfig();
    if ('hideStrategy' in content) {
      return (content as NgxFbAbstractControl).hideStrategy;
    }
    return undefined;
  });

  private readonly shouldStructurallyHide = computed(
    () => this.hideStrategy() === 'remove' && this.isHidden(),
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
