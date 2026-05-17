import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  Signal,
} from '@angular/core';
import { FormService } from '../../services/form.service';
import { controlContainerViewProviders } from '../../helper/control-container-view-providers';
import {
  FORM_LIFECYCLE_STATE,
  formLifecycleStateFactory,
} from '../../services/form-lifecycle-state';
import {
  FormConfigEntry,
  NGX_FW_FORM_VALUE,
  NgxFbBaseContent,
  NgxFbForm,
  NgxFbItem,
} from '@ngx-formbar/core';
import { NgxfbControlOutlet } from '../control-outlet/ngxfb-control-outlet.component';
import { NGXFB_CONTROL_ENTRIES } from '../../tokens/control-entries';

/**
 * Root component for an Ngx Formbar form. Takes a form configuration and
 * mounts each entry through the control outlet.
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
    {
      provide: NGX_FW_FORM_VALUE,
      useFactory: () => inject(FormService).formValue,
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
  readonly formConfig = input.required<NgxFbForm<T>>();

  readonly formContent: Signal<FormConfigEntry<T>[]> = computed(() =>
    Object.entries(this.formConfig().content).map(([name, config]) => ({
      name,
      config,
    })),
  );
}
