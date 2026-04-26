import {
  afterRenderEffect,
  ComponentRef,
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  Injector,
  input,
  OnDestroy,
  Signal,
  Type,
  untracked,
  ViewContainerRef,
} from '@angular/core';
import {
  NGX_FW_COMPONENT_RESOLVER,
  NgxFbBaseContent,
  NgxFbFormGroup,
  NgxFbItem,
  ValueStrategy,
} from '@ngx-formbar/core';
import { FormConfigEntry } from '../types/control-component.type';
import { withLoadedComponent } from '../composables/loaded-component';
import { ControlContainer, FormGroup } from '@angular/forms';
import { createBindings } from '../setup/bindings';
import { NGXFB_CONTROL_ENTRIES } from '../tokens/control-entries';
import { withDynamicTitle } from '../composables/dynamic-title';
import { withHiddenState } from '../composables/hidden.state';
import { withTestId } from '../composables/testId';

@Directive({
  selector: '[ngxfbGroup]',
})
export class NgxFbGroupDirective<T extends NgxFbBaseContent = NgxFbItem>
  implements OnDestroy
{
  private viewContainerRef = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);
  private parentContainer = inject(ControlContainer);
  private readonly contentRegistrationService = inject(
    NGX_FW_COMPONENT_RESOLVER,
  );

  private readonly parentGroupDirective: NgxFbGroupDirective<NgxFbFormGroup> | null =
    inject(NgxFbGroupDirective<NgxFbFormGroup>, {
      optional: true,
      skipSelf: true,
    });

  readonly config = input.required<FormConfigEntry<NgxFbFormGroup<T>>>({
    alias: 'ngxfbGroup',
  });

  private componentRef?: ComponentRef<unknown>;

  private readonly registrations =
    this.contentRegistrationService.registrations;

  private readonly controlConfig = computed(() => this.config().config);
  private readonly controlName = computed(() => this.config().name);

  private readonly registrationEntry = computed(() => {
    const registrations = this.registrations();
    const config = this.controlConfig();
    return registrations.get(config.type) ?? null;
  });

  private readonly hideStrategy = computed(
    () => this.controlConfig().hideStrategy,
  );

  private readonly keepValueWhenHidden = computed(
    () => this.hideStrategy() === 'keep',
  );

  private readonly parentValueStrategy = computed(() =>
    this.parentGroupDirective?.valueStrategy(),
  );

  readonly valueStrategy: Signal<ValueStrategy | undefined> = computed(
    () => this.controlConfig().valueStrategy ?? this.parentValueStrategy(),
  );

  private readonly handleVisibility = computed(
    () => (this.registrationEntry()?.keepValueWhenHidden ?? 'auto') === 'auto',
  );

  private readonly component = withLoadedComponent(this.registrationEntry);

  readonly isHidden = withHiddenState(this.controlConfig);

  readonly testId = withTestId(this.controlConfig, this.controlName);

  private readonly signalMap = new Map<string, Signal<unknown>>([
    ['name', this.controlName],
    ['isHidden', this.isHidden],
    ['hideStrategy', this.hideStrategy],
    ['valueStrategy', this.valueStrategy],
    ['testId', this.testId],
    ['titleText', computed(() => this.controlConfig().title)],
    ['dynamicTitle', withDynamicTitle(this.controlConfig)],
  ]);

  /**
   * Access to the parent FormGroup containing this group
   */
  private get parentFormGroup() {
    return this.parentContainer.control as FormGroup | null;
  }

  private get formGroup() {
    return this.parentFormGroup?.get(this.controlName()) as FormGroup | null;
  }

  constructor() {
    afterRenderEffect(() => {
      const component = this.component();

      this.viewContainerRef.clear();

      if (!component || !this.parentFormGroup) {
        return;
      }

      this.instantiateComponent(component);
    });

    effect(() => {
      const isHidden = this.isHidden();

      if (isHidden) {
        this.applyHiddenState();
        return;
      }

      this.applyVisibleState();
    });

    this.destroyRef.onDestroy(() => {
      this.componentRef?.destroy();
      this.parentFormGroup?.removeControl(this.controlName(), {
        emitEvent: false,
      });
    });
  }

  private applyHiddenState() {
    const handleVisibility = this.handleVisibility();
    const keepValueWhenHidden = this.keepValueWhenHidden();

    if (handleVisibility) {
      this.destroyComponent();
    }

    this.setValue();

    if (keepValueWhenHidden) {
      return;
    }

    this.removeGroup();
  }

  private applyVisibleState() {
    const controlName = this.controlName();
    const handleVisibility = this.handleVisibility();

    if (!this.formGroup) {
      this.setGroup(controlName);
    }

    // untracked because changes to that signal are already handled elsewhere
    const component = untracked(() => this.component());

    if (handleVisibility && component) {
      this.instantiateComponent(component);
    }
  }

  private setValue() {
    const valueStrategy = this.valueStrategy();

    switch (valueStrategy) {
      case 'last':
        break;
      case 'default':
        break;
      default:
        // Instead of resetting  the group, we need to reset the controls individually
        // to allow them to overwrite the value strategy
        // If a control doesn't have a value strategy, we reset it
        Object.entries(this.controlConfig().controls).forEach(
          ([name, control]) => {
            if (!('valueStrategy' in control)) {
              return;
            }

            if (control.valueStrategy) {
              return;
            }
            const formControl = this.formGroup?.get(name);
            if (formControl) {
              formControl.reset(undefined, { emitEvent: false });
            }
          },
        );
        break;
    }
  }

  private setGroup(controlName: string) {
    const controlInstance = new FormGroup({}, {});
    this.parentFormGroup?.setControl(controlName, controlInstance, {
      emitEvent: false,
    });
  }

  private removeGroup() {
    const controlName = this.controlName();

    // Check if control exists immediately before attempting removal
    if (!this.formGroup) {
      return;
    }
    this.parentFormGroup?.removeControl(controlName, { emitEvent: false });
  }

  private instantiateComponent(component: Type<unknown>) {
    const bindings = createBindings(
      component,
      this.signalMap,
      this.controlConfig,
    );

    const groupControls = computed<FormConfigEntry<NgxFbItem>[]>(() =>
      Object.entries(this.controlConfig().controls).map(([name, config]) => ({
        name,
        config,
      })),
    );

    const componentInjector = Injector.create({
      providers: [{ provide: NGXFB_CONTROL_ENTRIES, useValue: groupControls }],
      parent: this.viewContainerRef.injector,
    });

    this.componentRef = this.viewContainerRef.createComponent(component, {
      bindings: [...bindings],
      injector: componentInjector,
    });
  }

  private destroyComponent() {
    const instance = this.componentRef;

    if (!instance) {
      return;
    }

    this.viewContainerRef.detach();
  }

  ngOnDestroy() {
    this.removeGroup();
  }
}
