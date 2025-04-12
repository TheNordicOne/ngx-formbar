import { Component, computed, input, Type } from '@angular/core';
import { NgxFwContent } from '../../types/content.type';
import { NgComponentOutlet } from '@angular/common';

/**
 * Content Host Component
 *
 * This component dynamically renders form controls based on their type:
 * - Takes a content configuration object
 * - Looks up the corresponding component from registration map
 * - Dynamically renders the component with the content passed as input
 *
 * The component acts as a bridge between declarative content configuration
 * and the actual component implementation, enabling dynamic rendering of
 * different control types based on configuration.
 *
 * @template T Type extending NgxFwContent containing control configuration
 */
@Component({
  selector: 'ngxfw-content-host',
  imports: [NgComponentOutlet],
  templateUrl: './content-host.component.html',
})
export class ContentHostComponent<T extends NgxFwContent> {
  /**
   * Required input for control configuration
   * Defines properties like type, ID, validation, and other control-specific settings
   */
  readonly content = input.required<T>();

  /**
   * Required input containing registered control components
   * Maps control types to their component implementations
   */
  readonly registrations = input.required<Map<string, Type<unknown>>>();

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

  /**
   * Computed inputs for the dynamically rendered component
   * Passes content configuration to the component being rendered
   */
  readonly componentInputs = computed(() => ({ content: this.content() }));
}
