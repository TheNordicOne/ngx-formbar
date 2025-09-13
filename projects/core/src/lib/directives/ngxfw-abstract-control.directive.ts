import {
  computed,
  Directive,
  inject,
  input,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { NgxFwBaseContent } from '../types/content.type';
import { NGX_FW_COMPONENT_RESOLVER } from '../tokens/component-resolver';

/**
 * Structural directive that renders the appropriate component based on the control's type.
 *
 * This directive acts as a dynamic renderer for form controls, blocks, and groups.
 * It works by:
 * 1. Receiving a content configuration and name
 * 2. Looking up the registered component for the content's type
 * 3. Creating an instance of that component and binding the content and name to it
 *
 * This allows forms to be composed declaratively through configuration objects
 * rather than explicit templates.
 *
 * @example
 * ```html
 * <!-- Used with ngFor to render a list of controls -->
 * @for (control of controls(); track control[0]) {
 *   <ng-template *ngxfwAbstractControl="control" />
 * }
 *
 * <!-- Used directly with a specific control -->
 * <ng-template *ngxfwAbstractControl="['name', nameControlConfig]" />
 * ```
 */
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
    NGX_FW_COMPONENT_RESOLVER,
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
