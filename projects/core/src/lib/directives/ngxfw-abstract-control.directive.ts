import {
  computed,
  Directive,
  inject,
  input,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { NgxFwContent } from '../types/content.type';
import { ComponentRegistrationService } from '../services/component-registration.service';

@Directive({
  selector: '[ngxfwNgxfwAbstractControl]',
})
export class NgxfwAbstractControlDirective<T extends NgxFwContent>
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
   * Defines properties like type, ID, validation, and other control-specific settings
   */
  readonly content = input.required<T>({
    alias: 'ngxfwNgxfwAbstractControl',
  });

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
    const content = this.content();

    const component = registrations.get(content.type);
    return component ?? null;
  });

  ngOnInit() {
    const component = this.component();
    if (component) {
      const componentRef = this.viewContainerRef.createComponent(component);
      componentRef.setInput('content', this.content());
    }
  }
}
