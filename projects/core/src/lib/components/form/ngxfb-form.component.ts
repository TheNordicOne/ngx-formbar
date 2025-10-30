import { Component, computed, input } from '@angular/core';
import { FormService } from '../../services/form.service';
import { controlContainerViewProviders } from '../../helper/control-container-view-providers';
import { NgxfbAbstractControlDirective } from '../../directives/ngxfb-abstract-control.directive';
import { NgxFbBaseContent, NgxFbContent } from '../../types/content.type';
import { NgxFbForm } from '../../types/form.type';

/**
 * Ngx Formbar Form Component
 *
 * This component serves as the main container for Ngx Formbar forms:
 * - Takes a form configuration
 * - Establishes the form context through FormService provider
 * - Renders each content item using NgxfbAbstractControlDirective
 * - Handles component registration and dependency injection
 *
 * The component acts as the root element for declarative form creation,
 * processing the form content configuration and rendering the appropriate
 * components for each control defined in the configuration.
 */
@Component({
  selector: 'ngxfb-form',
  imports: [NgxfbAbstractControlDirective],
  templateUrl: './ngxfb-form.component.html',
  providers: [FormService],
  viewProviders: [controlContainerViewProviders],
})
export class NgxfbFormComponent<T extends NgxFbBaseContent = NgxFbContent> {
  /**
   * Required input containing form configuration
   */
  readonly formConfig = input.required<NgxFbForm<T>>();

  /**
   * Computed value containing form content
   */
  readonly formContent = computed(() =>
    Object.entries(this.formConfig().content),
  );
}
