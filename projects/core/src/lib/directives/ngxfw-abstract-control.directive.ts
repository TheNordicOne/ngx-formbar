import {
  computed,
  Directive,
  inject,
  input,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { NgxFwBaseContent } from '../types/content.type';
import { ComponentRegistrationService } from '../services/component-registration.service';

@Directive({
  selector: '[ngxfwAbstractControl]',
})
export class NgxfwAbstractControlDirective<T extends NgxFwBaseContent>
  implements OnInit
{
  private viewContainerRef = inject(ViewContainerRef);

  /**
   * Service for component registration
   * Provides access to component type mappings
   */
  private readonly contentRegistrationService = inject(
    ComponentRegistrationService,
  );

  /**
   * Required input for control configuration
   * Defines properties like type, validation, and other control-specific settings
   */
  readonly content = input.required<[string, T]>({
    alias: 'ngxfwAbstractControl',
  });

  readonly controlName = computed(() => this.content()[0]);
  readonly controlConfig = computed(() => this.content()[1]);

  /**
   * Registration map of component types
   * Maps control types to component implementations
   */
  readonly registrations = this.contentRegistrationService.registrations;

  /**
   * Computed component type based on content.type
   * Looks up the component implementation from registrations map
   */
  readonly component = computed(() => {
    const registrations = this.registrations();
    const content = this.controlConfig();

    const component = registrations.get(content.type);
    return component ?? null;
  });

  ngOnInit() {
    const component = this.component();
    if (component) {
      const componentRef = this.viewContainerRef.createComponent(component);
      componentRef.setInput('content', this.controlConfig());
      componentRef.setInput('name', this.controlName());
    }
  }
}
