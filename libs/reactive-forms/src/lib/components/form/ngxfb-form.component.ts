import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  input,
} from '@angular/core';
import { FormService } from '../../services/form.service';
import { FormLoaderService } from '../../services/form-loader.service';
import { controlContainerViewProviders } from '../../helper/control-container-view-providers';
import {
  FORM_LIFECYCLE_STATE,
  formLifecycleStateFactory,
} from '../../services/form-lifecycle-state';
import { ROW_IDENTITY, rowIdentityFactory } from '../../services/row-identity';
import {
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
      provide: ROW_IDENTITY,
      useFactory: rowIdentityFactory,
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
  // Resolved lazily in load(): FormService reads the bound ControlContainer
  // eagerly on construction, which is not available while this component is
  // being created.
  private readonly injector = inject(Injector);
  private readonly loader = inject(FormLoaderService);

  readonly formConfig = input.required<NgxFbForm<T>>();

  readonly formContent = computed(() =>
    Object.entries(this.formConfig().content).map(([name, config]) => ({
      name,
      config,
    })),
  );

  /**
   * Loads a value into the form. Grows every configured array to match the
   * incoming data before applying it, then patches. Use this instead of a
   * bare `patchValue` when the data contains array rows, since Angular's
   * `patchValue` cannot grow a `FormArray`.
   */
  load(data: Record<string, unknown>): void {
    const formGroup = this.injector.get(FormService).formGroup;
    this.loader.load(formGroup, this.formConfig(), data);
  }
}
