import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormService } from '../../services/form.service';
import { controlContainerViewProviders } from '../../helper/control-container-view-providers';
import {
  FORM_LIFECYCLE_STATE,
  formLifecycleStateFactory,
} from '../../services/form-lifecycle-state';
import { NgxFbBaseContent, NgxFbForm, NgxFbItem } from '@ngx-formbar/core';
import { NgxfbControlOutlet } from '../control-outlet/ngxfb-control-outlet.component';
import { NGXFB_CONTROL_ENTRIES } from '../../tokens/control-entries';

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
  imports: [NgxfbControlOutlet],
  template: `<ngxfb-control-outlet />`,
  providers: [
    FormService,
    {
      provide: FORM_LIFECYCLE_STATE,
      useFactory: formLifecycleStateFactory,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    controlContainerViewProviders,
    {
      provide: NGXFB_CONTROL_ENTRIES,
      useFactory: () => inject(NgxfbFormComponent).formContent,
    },
  ],
})
export class NgxfbFormComponent<T extends NgxFbBaseContent = NgxFbItem> {
  /**
   * Required input containing form configuration
   */
  readonly formConfig = input.required<NgxFbForm<T>>();

  /**
   * Computed value containing form content
   */
  readonly formContent = computed(() =>
    Object.entries(this.formConfig().content).map(([name, config]) => ({
      name,
      config,
    })),
  );
}
