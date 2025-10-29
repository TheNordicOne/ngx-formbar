import { Component, computed, input } from '@angular/core';
import { FormService } from '../../services/form.service';
import { controlContainerViewProviders } from '../../helper/control-container-view-providers';
import { NgxfwAbstractControlDirective } from '../../directives/ngxfw-abstract-control.directive';
import { NgxFwForm } from '../../types/form.type';
import { NgxFwBaseContent, NgxFwContent } from '../../types/content.type';

/**
 * Ngx Formwork Form Component
 *
 * This component serves as the main container for Ngx Formwork forms:
 * - Takes a form configuration
 * - Establishes the form context through FormService provider
 * - Renders each content item using NgxfwAbstractControlDirective
 * - Handles component registration and dependency injection
 *
 * The component acts as the root element for declarative form creation,
 * processing the form content configuration and rendering the appropriate
 * components for each control defined in the configuration.
 */
@Component({
  selector: 'ngxfw-form',
  imports: [NgxfwAbstractControlDirective],
  templateUrl: './ngx-fw-form.component.html',
  providers: [FormService],
  viewProviders: [controlContainerViewProviders],
})
export class NgxFwFormComponent<T extends NgxFwBaseContent = NgxFwContent> {
  /**
   * Required input containing form configuration
   */
  readonly formConfig = input.required<NgxFwForm<T>>();

  /**
   * Computed value containing form content
   */
  readonly formContent = computed(() =>
    Object.entries(this.formConfig().content),
  );
}
